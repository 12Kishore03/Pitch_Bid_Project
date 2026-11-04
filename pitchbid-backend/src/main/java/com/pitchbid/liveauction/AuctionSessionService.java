
package com.pitchbid.liveauction;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.player.Player;
import com.pitchbid.player.PlayerRepository;
import com.pitchbid.team.Team;
import com.pitchbid.team.TeamRepository;

@Service
public class AuctionSessionService {

    private final AuctionSessionRepository sessionRepository;
    private final AuctionRepository auctionRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final AuctionResultRepository resultRepository;

    public AuctionSessionService(
            AuctionSessionRepository sessionRepository,
            AuctionRepository auctionRepository,
            PlayerRepository playerRepository,
            TeamRepository teamRepository,
            AuctionResultRepository resultRepository) {

        this.sessionRepository = sessionRepository;
        this.auctionRepository = auctionRepository;
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.resultRepository = resultRepository;
    }

    // 1. CREATE OR GET EXISTING SESSION

    @Transactional
    public AuctionSession createSession(
            Long auctionId,
            String creatorEmail) {

        Auction auction = findOwnedAuction(auctionId, creatorEmail);

        if (!"LIVE".equalsIgnoreCase(auction.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Auction must be LIVE before creating its session"
            );
        }

        return sessionRepository.findByAuctionId(auctionId)
                .orElseGet(() -> sessionRepository.save(
                        new AuctionSession(auction)
                ));
    }

    // 2. GET EXISTING SESSION

    @Transactional(readOnly = true)
    public AuctionSession getSession(
            Long auctionId,
            String creatorEmail) {

        findOwnedAuction(auctionId, creatorEmail);

        AuctionSession session = sessionRepository
                .findByAuctionId(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction session not found"
                ));

        if ("BIDDING".equalsIgnoreCase(session.getSessionStatus())
                && session.getBidExpiresAt() != null) {

            long remainingSeconds = Duration.between(
                    LocalDateTime.now(),
                    session.getBidExpiresAt()
            ).getSeconds();

            session.setRemainingSeconds(
                    (int) Math.max(0, remainingSeconds)
            );
        }

        return session;
    }

    // 3. SELECT PLAYER AND START BIDDING

    @Transactional
    public AuctionSession selectPlayer(
            Long auctionId,
            Long playerId,
            String creatorEmail) {

        Auction auction = findOwnedAuction(auctionId, creatorEmail);

        if (!"LIVE".equalsIgnoreCase(auction.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Players can only be selected when the auction is LIVE"
            );
        }

        AuctionSession session = sessionRepository
                .findByAuctionId(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction session not found. Create the session first"
                ));

        if (!"READY".equalsIgnoreCase(session.getSessionStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The current auction session is not ready for another player"
            );
        }

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Player not found"
                ));

        if (player.getAuction() == null
                || !player.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Player not found in this auction"
            );
        }

        if (!"INDIVIDUAL".equalsIgnoreCase(
                player.getRegistrationType())
                || !"APPROVED".equalsIgnoreCase(player.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only approved individual players can be auctioned"
            );
        }

        if (resultRepository.existsByAuctionIdAndPlayerId(
                auctionId, playerId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This player has already been finalized"
            );
        }

        BigDecimal basePrice = player.getBasePrice();

        if (basePrice == null
                || basePrice.compareTo(BigDecimal.ZERO) <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Player must have a valid base price"
            );
        }

        Integer bidTimer = auction.getBidTimer();

        if (bidTimer == null || bidTimer <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Auction has an invalid bid timer"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        session.setCurrentPlayer(player);
        session.setCurrentBid(basePrice);
        session.setHighestBidTeam(null);

        session.setBidStartedAt(now);
        session.setBidExpiresAt(now.plusSeconds(bidTimer));

        session.setRemainingSeconds(bidTimer);
        session.setSessionStatus("BIDDING");

        return sessionRepository.save(session);
    }

    // 4. RAISE BID

    @Transactional
    public AuctionSession raiseBid(
            Long auctionId,
            Long teamId,
            String creatorEmail) {

        Auction auction = findOwnedAuction(auctionId, creatorEmail);

        if (!"LIVE".equalsIgnoreCase(auction.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bids can only be raised while the auction is LIVE"
            );
        }

        AuctionSession session = sessionRepository
                .findByAuctionId(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction session not found"
                ));

        if (!"BIDDING".equalsIgnoreCase(session.getSessionStatus())
                || session.getCurrentPlayer() == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No active player is currently being auctioned"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (session.getBidExpiresAt() == null
                || !now.isBefore(session.getBidExpiresAt())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bid timer has expired. No more bids are allowed"
            );
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Team not found"
                ));

        if (team.getAuction() == null
                || !team.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Team not found in this auction"
            );
        }

        if (!"APPROVED".equalsIgnoreCase(team.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only approved teams can raise bids"
            );
        }

        BigDecimal bidIncrement = auction.getBidIncrement();

        if (bidIncrement == null
                || bidIncrement.compareTo(BigDecimal.ZERO) <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Auction has an invalid bid increment"
            );
        }

        BigDecimal currentBid = session.getCurrentBid();

        if (currentBid == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Current bid is not initialized"
            );
        }

        // Calculate the next bid using the configured increment.
        BigDecimal nextBid = currentBid.add(bidIncrement);

        if (team.getRemainingBudget() == null
                || team.getRemainingBudget().compareTo(nextBid) < 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Team does not have sufficient budget for this bid"
            );
        }

        Integer bidTimer = auction.getBidTimer();

        if (bidTimer == null || bidTimer <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Auction has an invalid bid timer"
            );
        }

        session.setCurrentBid(nextBid);
        session.setHighestBidTeam(team);

        // Reset the timer after every accepted bid.
        LocalDateTime bidTime = LocalDateTime.now();

        session.setBidStartedAt(bidTime);
        session.setBidExpiresAt(bidTime.plusSeconds(bidTimer));
        session.setRemainingSeconds(bidTimer);

        return sessionRepository.save(session);
    }

    // 5. FINALIZE PLAYER AS SOLD

    @Transactional
    public AuctionResult finalizeSold(
            Long auctionId,
            String creatorEmail) {

        Auction auction = findOwnedAuction(auctionId, creatorEmail);

        if (!"LIVE".equalsIgnoreCase(auction.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Auction must be LIVE to finalize a player"
            );
        }

        AuctionSession session = sessionRepository
                .findByAuctionId(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction session not found"
                ));

        if (!"BIDDING".equalsIgnoreCase(session.getSessionStatus())
                || session.getCurrentPlayer() == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No active player is available for finalization"
            );
        }

        // Reload the player directly from the database.
        Long playerId = session.getCurrentPlayer().getId();

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Player not found"
                ));

        // Verify the player belongs to this auction.
        if (player.getAuction() == null
                || !player.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Player does not belong to this auction"
            );
        }

        Team winningTeam = session.getHighestBidTeam();
        BigDecimal finalPrice = session.getCurrentBid();

        if (winningTeam == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot mark player as SOLD without an accepted bid"
            );
        }

        if (!"APPROVED".equalsIgnoreCase(winningTeam.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Winning team is not approved"
            );
        }

        if (finalPrice == null
                || finalPrice.compareTo(BigDecimal.ZERO) <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Invalid final bid amount"
            );
        }

        if (winningTeam.getAuction() == null
                || !winningTeam.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Winning team does not belong to this auction"
            );
        }

        if (resultRepository.existsByAuctionIdAndPlayerId(
                auctionId, playerId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This player has already been finalized"
            );
        }

        if (winningTeam.getRemainingBudget() == null
                || winningTeam.getRemainingBudget().compareTo(finalPrice) < 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Winning team does not have sufficient remaining budget"
            );
        }

        // STEP 1: Assign the player to the winning team.
        // This updates players.team_id.
        player.setTeam(winningTeam);
        playerRepository.save(player);

        // STEP 2: Deduct the final sold amount from the team budget.
        BigDecimal remainingBudget =
                winningTeam.getRemainingBudget().subtract(finalPrice);

        winningTeam.setRemainingBudget(remainingBudget);
        teamRepository.save(winningTeam);

        // STEP 3: Save the permanent auction result.
        AuctionResult result = new AuctionResult(
                auction,
                player,
                winningTeam,
                finalPrice,
                "SOLD"
        );

        resultRepository.save(result);

        // STEP 4: Reset the auction session.
        resetSession(session);
        sessionRepository.save(session);

        return result;
    }

    // 6. FINALIZE PLAYER AS UNSOLD

    @Transactional
    public AuctionResult finalizeUnsold(
            Long auctionId,
            String creatorEmail) {

        Auction auction = findOwnedAuction(auctionId, creatorEmail);

        if (!"LIVE".equalsIgnoreCase(auction.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Auction must be LIVE to finalize a player"
            );
        }

        AuctionSession session = sessionRepository
                .findByAuctionId(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction session not found"
                ));

        if (!"BIDDING".equalsIgnoreCase(session.getSessionStatus())
                || session.getCurrentPlayer() == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No active player is available for finalization"
            );
        }

        Player player = session.getCurrentPlayer();

        if (session.getHighestBidTeam() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A player with an accepted bid cannot be marked UNSOLD"
            );
        }

        // Only finalize as UNSOLD after the timer expires.
        if (session.getBidExpiresAt() == null
                || LocalDateTime.now().isBefore(session.getBidExpiresAt())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The bid timer is still running. Wait until it expires before marking the player UNSOLD"
            );
        }

        if (resultRepository.existsByAuctionIdAndPlayerId(
                auctionId, player.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This player has already been finalized"
            );
        }

        AuctionResult result = new AuctionResult(
                auction,
                player,
                null,
                null,
                "UNSOLD"
        );

        resultRepository.save(result);

        resetSession(session);
        sessionRepository.save(session);

        return result;
    }

    // 7. RESET SESSION AFTER FINALIZATION

    private void resetSession(AuctionSession session) {

        session.setCurrentPlayer(null);
        session.setCurrentBid(null);
        session.setHighestBidTeam(null);

        session.setBidStartedAt(null);
        session.setBidExpiresAt(null);
        session.setRemainingSeconds(null);

        session.setSessionStatus("READY");
    }

    // 8. GET AUCTION AND VERIFY CREATOR OWNERSHIP

    private Auction findOwnedAuction(
            Long auctionId,
            String creatorEmail) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"
                ));

        if (auction.getCreator() == null
                || auction.getCreator().getEmail() == null
                || !auction.getCreator().getEmail()
                        .equalsIgnoreCase(creatorEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to manage this auction"
            );
        }

        return auction;
    }
}

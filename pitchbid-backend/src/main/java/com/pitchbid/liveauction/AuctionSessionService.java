
package com.pitchbid.liveauction;

import java.math.BigDecimal;
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

    public AuctionSessionService(
            AuctionSessionRepository sessionRepository,
            AuctionRepository auctionRepository,
            PlayerRepository playerRepository,
            TeamRepository teamRepository) {

        this.sessionRepository = sessionRepository;
        this.auctionRepository = auctionRepository;
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
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

        return sessionRepository.findByAuctionId(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction session not found"
                ));
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

        BigDecimal basePrice = player.getBasePrice();

        if (basePrice == null
                || basePrice.compareTo(BigDecimal.ZERO) <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Player must have a valid base price"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        session.setCurrentPlayer(player);
        session.setCurrentBid(basePrice);
        session.setHighestBidTeam(null);

        session.setBidStartedAt(now);
        session.setBidExpiresAt(
                now.plusSeconds(auction.getBidTimer())
        );

        session.setRemainingSeconds(auction.getBidTimer());
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

        // Auction must be LIVE.
        if (!"LIVE".equalsIgnoreCase(auction.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bids can only be raised while the auction is LIVE"
            );
        }

        // Find the current session.
        AuctionSession session = sessionRepository
                .findByAuctionId(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction session not found"
                ));

        // A player must already be selected.
        if (!"BIDDING".equalsIgnoreCase(session.getSessionStatus())
                || session.getCurrentPlayer() == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No active player is currently being auctioned"
            );
        }

        // Check timer expiry.
        LocalDateTime now = LocalDateTime.now();

        if (session.getBidExpiresAt() == null
                || !now.isBefore(session.getBidExpiresAt())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bid timer has expired. No more bids are allowed"
            );
        }

        // Find the selected team.
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Team not found"
                ));

        // Verify that the team belongs to this auction.
        if (team.getAuction() == null
                || !team.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Team not found in this auction"
            );
        }

        // Only approved teams can participate.
        if (!"APPROVED".equalsIgnoreCase(team.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only approved teams can raise bids"
            );
        }

        // Get configured bid increment.
        BigDecimal bidIncrement = auction.getBidIncrement();

        if (bidIncrement == null
                || bidIncrement.compareTo(BigDecimal.ZERO) <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Auction has an invalid bid increment"
            );
        }

        // Calculate the next bid automatically.
        BigDecimal currentBid = session.getCurrentBid();

        if (currentBid == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Current bid is not initialized"
            );
        }

        BigDecimal nextBid = currentBid.add(bidIncrement);

        // Verify that the team has enough remaining budget.
        if (team.getRemainingBudget() == null
                || team.getRemainingBudget().compareTo(nextBid) < 0) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Team does not have sufficient budget for this bid"
            );
        }

        // Update the highest bid and team.
        session.setCurrentBid(nextBid);
        session.setHighestBidTeam(team);

        // Reset the bid timer.
        session.setBidStartedAt(now);
        session.setBidExpiresAt(
                now.plusSeconds(auction.getBidTimer())
        );

        session.setRemainingSeconds(auction.getBidTimer());

        return sessionRepository.save(session);
    }

    // 5. GET AUCTION AND VERIFY CREATOR OWNERSHIP

    private Auction findOwnedAuction(
            Long auctionId,
            String creatorEmail) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"
                ));

        if (auction.getCreator() == null
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

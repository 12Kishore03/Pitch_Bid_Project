
package com.pitchbid.registration;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.player.Player;
import com.pitchbid.player.PlayerRepository;
import com.pitchbid.registration.dto.PlayerRegistrationDetailsResponse;
import com.pitchbid.registration.dto.PlayerRegistrationRequest;
import com.pitchbid.registration.dto.PlayerRegistrationResponse;
import com.pitchbid.team.TeamRepository;

@Service
public class PlayerRegistrationService {

    private final AuctionRepository auctionRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final TeamOwnerRegistrationRepository ownerRegistrationRepository;

    public PlayerRegistrationService(
            AuctionRepository auctionRepository,
            PlayerRepository playerRepository,
            TeamRepository teamRepository,
            TeamOwnerRegistrationRepository ownerRegistrationRepository) {

        this.auctionRepository = auctionRepository;
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.ownerRegistrationRepository = ownerRegistrationRepository;
    }

    // =========================================================
    // 1. REGISTER AN INDIVIDUAL PLAYER
    // =========================================================

    @Transactional
    public PlayerRegistrationResponse registerPlayer(
            Long auctionId,
            PlayerRegistrationRequest request) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"));

        if (!auction.isPlayerRegistration()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Player registration is disabled for this auction");
        }

        LocalDateTime now = LocalDateTime.now();

        if (auction.getStartDate() != null
                && !now.isBefore(auction.getStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Player registration has closed because the auction has started");
        }

        if (auction.getRegistrationDeadline() != null
                && now.isAfter(auction.getRegistrationDeadline())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The player registration deadline has passed");
        }

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        // Prevent duplicate player registrations.
        if (playerRepository.existsByAuctionIdAndEmailIgnoreCase(
                auctionId, email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This email is already registered as a player in this auction");
        }

        // A team owner cannot register again as an individual player.
        if (ownerRegistrationRepository
                    .existsByAuctionIdAndOwnerEmailIgnoreCase(
                            auctionId, email)
                || teamRepository.existsByAuctionIdAndOwnerEmailIgnoreCase(
                        auctionId, email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A registered team owner cannot register again as an individual player");
        }

        /*
         * CAPACITY RULE:
         * PENDING  -> counts
         * APPROVED -> counts
         * REJECTED -> does not count
         *
         * Owner Player #1 is included because it is already
         * stored in the players table.
         */
        long registeredPlayers =
                playerRepository.countByAuctionIdAndStatusNot(
                        auctionId, "REJECTED");

        if (registeredPlayers >= auction.getMaxAuctionPlayers()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The maximum player registration capacity has been reached");
        }

       Player player = new Player(
        auction,
        null,
        null,
        request.fullName().trim(),
        email,
        request.phone().trim(),
        request.dateOfBirth(),
        request.gender().trim(),
        request.city().trim(),
        request.playerRole().trim(),
        request.battingStyle().trim(),
        request.bowlingStyle().trim(),
        Boolean.TRUE.equals(request.wicketkeeper()),
        "INDIVIDUAL"
);

// Save the base price submitted by the player.
player.setBasePrice(request.basePrice());

// New registrations require creator approval.
player.setStatus("PENDING");

Player savedPlayer = playerRepository.save(player);

        return new PlayerRegistrationResponse(
                savedPlayer.getId(),
                auction.getId(),
                savedPlayer.getFullName(),
                savedPlayer.getEmail(),
                savedPlayer.getRegistrationType(),
                savedPlayer.getStatus(),
                savedPlayer.getRegisteredAt()
        );
    }

    // =========================================================
    // 2. GET ALL PLAYER REGISTRATIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<PlayerRegistrationDetailsResponse> getPlayerRegistrations(
            Long auctionId,
            String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        return playerRepository
                .findByAuctionIdOrderByRegisteredAtDesc(auctionId)
                .stream()
                .map(this::toPlayerRegistrationDetailsResponse)
                .toList();
    }

    // =========================================================
    // 3. GET PLAYER REGISTRATIONS BY STATUS
    // =========================================================

    @Transactional(readOnly = true)
    public List<PlayerRegistrationDetailsResponse>
            getPlayerRegistrationsByStatus(
                    Long auctionId,
                    String status,
                    String creatorEmail) {

        String normalizedStatus = validateAndNormalizeStatus(status);

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        return playerRepository
                .findByAuctionIdAndStatusOrderByRegisteredAtDesc(
                        auctionId, normalizedStatus)
                .stream()
                .map(this::toPlayerRegistrationDetailsResponse)
                .toList();
    }

    // =========================================================
    // 4. APPROVE A PLAYER REGISTRATION
    // =========================================================

    @Transactional
    public PlayerRegistrationDetailsResponse approvePlayerRegistration(
            Long auctionId,
            Long playerId,
            String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        Player player = findPlayerInAuction(auctionId, playerId);

        if (!"PENDING".equalsIgnoreCase(player.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending player registrations can be approved");
        }

        player.setStatus("APPROVED");

        Player savedPlayer = playerRepository.save(player);

        return toPlayerRegistrationDetailsResponse(savedPlayer);
    }

    // =========================================================
    // 5. REJECT A PLAYER REGISTRATION
    // =========================================================

    @Transactional
    public PlayerRegistrationDetailsResponse rejectPlayerRegistration(
            Long auctionId,
            Long playerId,
            String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        Player player = findPlayerInAuction(auctionId, playerId);

        if (!"PENDING".equalsIgnoreCase(player.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending player registrations can be rejected");
        }

        player.setStatus("REJECTED");

        Player savedPlayer = playerRepository.save(player);

        return toPlayerRegistrationDetailsResponse(savedPlayer);
    }

    // =========================================================
    // 6. FIND PLAYER AND VERIFY AUCTION
    // =========================================================

    private Player findPlayerInAuction(
            Long auctionId,
            Long playerId) {

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Player registration not found"));

        if (!player.getAuction().getId().equals(auctionId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Player registration not found in this auction");
        }

        return player;
    }

    // =========================================================
    // 7. VALIDATE STATUS FILTER
    // =========================================================

    private String validateAndNormalizeStatus(String status) {

        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration status is required");
        }

        String normalizedStatus =
                status.trim().toUpperCase(Locale.ROOT);

        if (!List.of("PENDING", "APPROVED", "REJECTED")
                .contains(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid registration status. Allowed values: PENDING, APPROVED, REJECTED");
        }

        return normalizedStatus;
    }

    // =========================================================
    // 8. VERIFY AUCTION OWNERSHIP
    // =========================================================

    private void validateCreatorOwnsAuction(
            Long auctionId,
            String creatorEmail) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"));

        if (auction.getCreator() == null
                || !auction.getCreator().getEmail()
                        .equalsIgnoreCase(creatorEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to manage this auction");
        }
    }

    // =========================================================
    // 9. CONVERT PLAYER ENTITY TO RESPONSE DTO
    // =========================================================

   private PlayerRegistrationDetailsResponse
        toPlayerRegistrationDetailsResponse(Player player) {

    return new PlayerRegistrationDetailsResponse(
            player.getId(),
            player.getFullName(),
            player.getEmail(),
            player.getPhone(),
            player.getDateOfBirth(),
            player.getGender(),
            player.getCity(),
            player.getPlayerRole(),
            player.getBattingStyle(),
            player.getBowlingStyle(),
            player.isWicketkeeper(),
            player.getRegistrationType(),
            player.getStatus(),
            player.getRegisteredAt(),
            player.getBasePrice()
    );
}
}

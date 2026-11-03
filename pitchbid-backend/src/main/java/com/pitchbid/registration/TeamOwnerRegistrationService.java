
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
import com.pitchbid.registration.dto.TeamOwnerRegistrationDetailsResponse;
import com.pitchbid.registration.dto.TeamOwnerRegistrationRequest;
import com.pitchbid.registration.dto.TeamOwnerRegistrationResponse;
import com.pitchbid.team.Team;
import com.pitchbid.team.TeamRepository;

@Service
public class TeamOwnerRegistrationService {

    private final AuctionRepository auctionRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final TeamOwnerRegistrationRepository registrationRepository;

    public TeamOwnerRegistrationService(
            AuctionRepository auctionRepository,
            TeamRepository teamRepository,
            PlayerRepository playerRepository,
            TeamOwnerRegistrationRepository registrationRepository) {

        this.auctionRepository = auctionRepository;
        this.teamRepository = teamRepository;
        this.playerRepository = playerRepository;
        this.registrationRepository = registrationRepository;
    }

    // =========================================================
    // 1. REGISTER TEAM OWNER AND CREATE TEAM + OWNER PLAYER #1
    // =========================================================

    @Transactional
    public TeamOwnerRegistrationResponse registerTeamOwner(
            Long auctionId,
            TeamOwnerRegistrationRequest request) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"));

        if (!auction.isTeamRegistration()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Team registration is disabled for this auction");
        }

        LocalDateTime now = LocalDateTime.now();

        if (auction.getStartDate() != null
                && !now.isBefore(auction.getStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Team registration has closed because the auction has started");
        }

        if (auction.getRegistrationDeadline() != null
                && now.isAfter(auction.getRegistrationDeadline())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The registration deadline has passed");
        }

        // Count only pending and approved teams.
        long registeredTeams =
                teamRepository.countByAuctionIdAndStatusIn(
                        auctionId,
                        List.of("PENDING", "APPROVED"));

        if (registeredTeams >= auction.getNumberOfTeams()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The maximum number of teams has been reached");
        }

        String ownerName = request.fullName().trim();
        String ownerEmail = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);
        String ownerPhone = request.phone().trim();
        String teamName = request.teamName().trim();
        String teamShortName = request.teamShortName()
                .trim()
                .toUpperCase(Locale.ROOT);

        // Prevent duplicate team-owner email registrations.
        if (teamRepository.existsByAuctionIdAndOwnerEmailIgnoreCase(
                    auctionId, ownerEmail)
                || registrationRepository
                    .existsByAuctionIdAndOwnerEmailIgnoreCase(
                            auctionId, ownerEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This email has already registered as a team owner");
        }

        // Prevent duplicate team names.
        if (teamRepository.existsByAuctionIdAndTeamNameIgnoreCase(
                auctionId, teamName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This team name is already registered");
        }

        // Prevent duplicate team short names.
        if (teamRepository.existsByAuctionIdAndTeamShortNameIgnoreCase(
                auctionId, teamShortName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This team short name is already registered");
        }

        // The new owner will occupy one player slot.
        // Rejected players do not count toward the capacity.
        long existingPlayers =
                playerRepository.countByAuctionIdAndStatusNot(
                        auctionId, "REJECTED");

        if (existingPlayers + 1 > auction.getMaxAuctionPlayers()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No player slots remain for this auction");
        }

        // Create the team with its initial budget.
        Team team = new Team(
                auction,
                ownerName,
                ownerEmail,
                ownerPhone,
                teamName,
                teamShortName,
                request.teamCity(),
                request.teamDescription(),
                null
        );

        team = teamRepository.save(team);

        // Create the team-owner registration.
        TeamOwnerRegistration registration =
                new TeamOwnerRegistration(
                        auction,
                        team,
                        ownerName,
                        ownerEmail,
                        ownerPhone
                );

        registration = registrationRepository.save(registration);

        // Automatically register the owner as Player #1.
        Player ownerPlayer = new Player(
                auction,
                team,
                1,
                ownerName,
                ownerEmail,
                ownerPhone,
                request.dateOfBirth(),
                request.gender(),
                request.city(),
                request.playerRole(),
                request.battingStyle(),
                request.bowlingStyle(),
                Boolean.TRUE.equals(request.wicketkeeper()),
                "OWNER_PLAYER"
        );

        ownerPlayer.setStatus("PENDING");
        ownerPlayer = playerRepository.save(ownerPlayer);

        return new TeamOwnerRegistrationResponse(
                registration.getId(),
                auction.getId(),
                team.getId(),
                ownerPlayer.getId(),
                ownerName,
                teamName,
                teamShortName,
                registration.getStatus(),
                ownerPlayer.getPlayerNumber(),
                registration.getRegisteredAt()
        );
    }

    // =========================================================
    // 2. GET ALL TEAM-OWNER REGISTRATIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<TeamOwnerRegistrationDetailsResponse>
            getTeamOwnerRegistrations(
                    Long auctionId,
                    String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        return registrationRepository
                .findByAuctionIdOrderByRegisteredAtDesc(auctionId)
                .stream()
                .map(this::toTeamOwnerRegistrationDetailsResponse)
                .toList();
    }

    // =========================================================
    // 3. GET TEAM-OWNER REGISTRATIONS BY STATUS
    // =========================================================

    @Transactional(readOnly = true)
    public List<TeamOwnerRegistrationDetailsResponse>
            getTeamOwnerRegistrationsByStatus(
                    Long auctionId,
                    String status,
                    String creatorEmail) {

        String normalizedStatus = validateAndNormalizeStatus(status);

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        return registrationRepository
                .findByAuctionIdAndStatusOrderByRegisteredAtDesc(
                        auctionId, normalizedStatus)
                .stream()
                .map(this::toTeamOwnerRegistrationDetailsResponse)
                .toList();
    }

    // =========================================================
    // 4. APPROVE TEAM-OWNER REGISTRATION
    // =========================================================

    @Transactional
    public TeamOwnerRegistrationDetailsResponse
            approveTeamOwnerRegistration(
                    Long auctionId,
                    Long registrationId,
                    String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        TeamOwnerRegistration registration =
                findRegistrationInAuction(auctionId, registrationId);

        if (!"PENDING".equalsIgnoreCase(registration.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending team-owner registrations can be approved");
        }

        Team team = registration.getTeam();

        Player ownerPlayer = findOwnerPlayer(
                auctionId, registration.getOwnerEmail());

        registration.setStatus("APPROVED");
        team.setStatus("APPROVED");
        ownerPlayer.setStatus("APPROVED");

        registrationRepository.save(registration);
        teamRepository.save(team);
        playerRepository.save(ownerPlayer);

        return toTeamOwnerRegistrationDetailsResponse(registration);
    }

    // =========================================================
    // 5. REJECT TEAM-OWNER REGISTRATION
    // =========================================================

    @Transactional
    public TeamOwnerRegistrationDetailsResponse
            rejectTeamOwnerRegistration(
                    Long auctionId,
                    Long registrationId,
                    String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        TeamOwnerRegistration registration =
                findRegistrationInAuction(auctionId, registrationId);

        if (!"PENDING".equalsIgnoreCase(registration.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending team-owner registrations can be rejected");
        }

        Team team = registration.getTeam();

        Player ownerPlayer = findOwnerPlayer(
                auctionId, registration.getOwnerEmail());

        registration.setStatus("REJECTED");
        team.setStatus("REJECTED");
        ownerPlayer.setStatus("REJECTED");

        registrationRepository.save(registration);
        teamRepository.save(team);
        playerRepository.save(ownerPlayer);

        return toTeamOwnerRegistrationDetailsResponse(registration);
    }

    // =========================================================
    // 6. FIND REGISTRATION AND VERIFY AUCTION
    // =========================================================

    private TeamOwnerRegistration findRegistrationInAuction(
            Long auctionId,
            Long registrationId) {

        TeamOwnerRegistration registration =
                registrationRepository.findById(registrationId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Team-owner registration not found"));

        if (!registration.getAuction().getId().equals(auctionId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Team-owner registration not found in this auction");
        }

        return registration;
    }

    // =========================================================
    // 7. FIND THE AUTOMATICALLY CREATED OWNER PLAYER
    // =========================================================

    private Player findOwnerPlayer(
            Long auctionId,
            String ownerEmail) {

        return playerRepository
                .findByAuctionIdAndEmailIgnoreCase(auctionId, ownerEmail)
                .stream()
                .filter(player -> "OWNER_PLAYER".equalsIgnoreCase(
                        player.getRegistrationType()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Owner Player #1 was not found for this registration"));
    }

    // =========================================================
    // 8. VALIDATE REGISTRATION STATUS FILTER
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
                    "Invalid status. Allowed values: PENDING, APPROVED, REJECTED");
        }

        return normalizedStatus;
    }

    // =========================================================
    // 9. VERIFY AUCTION OWNERSHIP
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
    // 10. CONVERT ENTITY TO RESPONSE DTO
    // =========================================================

    private TeamOwnerRegistrationDetailsResponse
            toTeamOwnerRegistrationDetailsResponse(
                    TeamOwnerRegistration registration) {

        return new TeamOwnerRegistrationDetailsResponse(
                registration.getId(),
                registration.getTeam().getId(),
                registration.getOwnerName(),
                registration.getOwnerEmail(),
                registration.getOwnerPhone(),
                registration.getTeam().getTeamName(),
                registration.getTeam().getTeamShortName(),
                registration.getStatus(),
                registration.getRegisteredAt()
        );
    }
}

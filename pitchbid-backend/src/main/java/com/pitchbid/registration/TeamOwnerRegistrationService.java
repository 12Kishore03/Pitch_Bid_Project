
package com.pitchbid.registration;

import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.player.Player;
import com.pitchbid.player.PlayerRepository;
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

    @Transactional
    public TeamOwnerRegistrationResponse registerTeamOwner(
            Long auctionId,
            TeamOwnerRegistrationRequest request) {

        // 1. Find the auction.
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Auction not found"));

        // 2. Check whether team registration is enabled.
        if (!auction.isTeamRegistration()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Team registration is disabled for this auction");
        }

        // 3. Check the registration deadline.
        LocalDateTime now = LocalDateTime.now();

        if (auction.getRegistrationDeadline() != null
                && now.isAfter(auction.getRegistrationDeadline())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The registration deadline has passed");
        }

        // 4. Count pending and approved teams toward the team limit.
        if (teamRepository.countByAuctionId(auctionId)
                >= auction.getNumberOfTeams()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The maximum number of teams has been reached");
        }

        // 5. Normalize user-provided values.
        String ownerName = request.fullName().trim();
        String ownerEmail = request.email().trim()
                .toLowerCase(Locale.ROOT);
        String ownerPhone = request.phone().trim();
        String teamName = request.teamName().trim();
        String teamShortName = request.teamShortName().trim()
                .toUpperCase(Locale.ROOT);

        // 6. Check for duplicate owner registrations.
        if (teamRepository.existsByAuctionIdAndOwnerEmailIgnoreCase(
                    auctionId, ownerEmail)
                || registrationRepository
                    .existsByAuctionIdAndOwnerEmailIgnoreCase(
                            auctionId, ownerEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This email has already registered as a team owner");
        }

        // 7. Check for duplicate team names.
        if (teamRepository.existsByAuctionIdAndTeamNameIgnoreCase(
                auctionId, teamName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This team name is already registered");
        }

        if (teamRepository.existsByAuctionIdAndTeamShortNameIgnoreCase(
                auctionId, teamShortName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This team short name is already registered");
        }

        // 8. The owner also occupies one player slot.
        if (playerRepository.countByAuctionId(auctionId) + 1
                > auction.getMaxAuctionPlayers()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No player slots remain for this auction");
        }

        // 9. Create the team with its initial budget.
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

        // 10. Create the owner registration.
        TeamOwnerRegistration registration =
                new TeamOwnerRegistration(
                        auction,
                        team,
                        ownerName,
                        ownerEmail,
                        ownerPhone
                );

        registration = registrationRepository.save(registration);

        // 11. Automatically register the owner as Player #1.
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

        ownerPlayer = playerRepository.save(ownerPlayer);

        // 12. Return the registration details.
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
}

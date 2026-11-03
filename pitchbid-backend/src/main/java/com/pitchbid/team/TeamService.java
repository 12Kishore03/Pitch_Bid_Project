
package com.pitchbid.team;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.team.dto.TeamResponse;
import com.pitchbid.team.dto.UpdateTeamRequest;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final AuctionRepository auctionRepository;

    public TeamService(
            TeamRepository teamRepository,
            AuctionRepository auctionRepository) {

        this.teamRepository = teamRepository;
        this.auctionRepository = auctionRepository;
    }

    // 1. GET ALL TEAMS BELONGING TO AN AUCTION

    @Transactional(readOnly = true)
    public List<TeamResponse> getTeams(
            Long auctionId,
            String status,
            String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        List<Team> teams;

        if (status == null || status.isBlank()) {

            teams = teamRepository.findByAuctionId(auctionId);

        } else {

            String normalizedStatus =
                    validateAndNormalizeStatus(status);

            teams = teamRepository.findByAuctionIdAndStatus(
                    auctionId,
                    normalizedStatus
            );
        }

        return teams.stream()
                .map(this::toTeamResponse)
                .toList();
    }

    // 2. GET A SPECIFIC TEAM

    @Transactional(readOnly = true)
    public TeamResponse getTeamById(
            Long auctionId,
            Long teamId,
            String creatorEmail) {

        validateCreatorOwnsAuction(auctionId, creatorEmail);

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Team not found"
                ));

        if (!team.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Team not found in this auction"
            );
        }

        return toTeamResponse(team);
    }

    
    // 3. UPDATE TEAM DETAILS

    @Transactional
    public TeamResponse updateTeam(
            Long auctionId,
            Long teamId,
            UpdateTeamRequest request,
            String creatorEmail) {

        // Verify that the logged-in Creator owns the auction.
        validateCreatorOwnsAuction(auctionId, creatorEmail);

        // Find the team.
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Team not found"
                ));

        // Ensure the team belongs to the requested auction.
        if (!team.getAuction().getId().equals(auctionId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Team not found in this auction"
            );
        }

        // Allow team editing only before the auction starts.
        if (!"UPCOMING".equalsIgnoreCase(
                team.getAuction().getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Team details can only be updated while the auction is UPCOMING"
            );
        }

        // Normalize the input.
        String teamName = request.teamName().trim();

        String teamShortName = request.teamShortName()
                .trim()
                .toUpperCase(Locale.ROOT);

        // Check duplicate team name within the same auction.
        if (teamRepository
                .existsByAuctionIdAndTeamNameIgnoreCaseAndIdNot(
                        auctionId,
                        teamName,
                        teamId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This team name is already used in this auction"
            );
        }

        // Check duplicate team short name within the same auction.
        if (teamRepository
                .existsByAuctionIdAndTeamShortNameIgnoreCaseAndIdNot(
                        auctionId,
                        teamShortName,
                        teamId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This team short name is already used in this auction"
            );
        }

        // Update only the permitted team fields.
        team.setTeamName(teamName);
        team.setTeamShortName(teamShortName);
        team.setTeamCity(request.teamCity() == null
                ? null : request.teamCity().trim());

        team.setTeamDescription(request.teamDescription() == null
                ? null : request.teamDescription().trim());

        team.setTeamLogoPath(request.teamLogoPath() == null
                ? null : request.teamLogoPath().trim());

        // Save the updated team.
        Team updatedTeam = teamRepository.save(team);

        return toTeamResponse(updatedTeam);
    }


    // 3. VALIDATE TEAM STATUS FILTER

    private String validateAndNormalizeStatus(String status) {

        String normalizedStatus =
                status.trim().toUpperCase(Locale.ROOT);

        if (!List.of("PENDING", "APPROVED", "REJECTED")
                .contains(normalizedStatus)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid team status. Allowed values: PENDING, APPROVED, REJECTED"
            );
        }

        return normalizedStatus;
    }

    // 4. VERIFY AUCTION OWNERSHIP

    private void validateCreatorOwnsAuction(
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
                    "You are not allowed to manage this auction"
            );
        }
    }

    // 5. CONVERT TEAM ENTITY TO RESPONSE DTO

    private TeamResponse toTeamResponse(Team team) {

        return new TeamResponse(
                team.getId(),
                team.getAuction().getId(),
                team.getOwnerName(),
                team.getOwnerEmail(),
                team.getOwnerPhone(),
                team.getTeamName(),
                team.getTeamShortName(),
                team.getTeamCity(),
                team.getTeamDescription(),
                team.getTeamLogoPath(),
                team.getRemainingBudget(),
                team.getStatus(),
                team.getRegisteredAt()
        );
    }
}

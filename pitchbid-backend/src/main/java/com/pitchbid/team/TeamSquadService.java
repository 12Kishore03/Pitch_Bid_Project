
package com.pitchbid.team;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.liveauction.AuctionResult;
import com.pitchbid.liveauction.AuctionResultRepository;
import com.pitchbid.team.dto.TeamSquadResponse;
import com.pitchbid.team.dto.TeamSquadResponse.PurchasedPlayer;

@Service
public class TeamSquadService {

    private final AuctionRepository auctionRepository;
    private final TeamRepository teamRepository;
    private final AuctionResultRepository auctionResultRepository;

    public TeamSquadService(
            AuctionRepository auctionRepository,
            TeamRepository teamRepository,
            AuctionResultRepository auctionResultRepository) {

        this.auctionRepository = auctionRepository;
        this.teamRepository = teamRepository;
        this.auctionResultRepository = auctionResultRepository;
    }

    public TeamSquadResponse getTeamSquad(
            Long auctionId,
            Long teamId,
            String creatorEmail) {

        // Step 1: Find auction
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"));

        // Step 2: Verify Creator ownership
        if (auction.getCreator() == null
                || auction.getCreator().getEmail() == null
                || !auction.getCreator().getEmail()
                        .equalsIgnoreCase(creatorEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to view this team's squad");
        }

        // Step 3: Find team
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Team not found"));

        // Step 4: Verify team belongs to this auction
        if (team.getAuction() == null
                || !team.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Team does not belong to this auction");
        }

        // Step 5: Fetch auction results for this team
        List<AuctionResult> results =
                auctionResultRepository
                        .findByAuctionIdAndTeamIdOrderByFinalizedAtDesc(
                                auctionId,
                                teamId);

        // Step 6: Include only SOLD players
        List<PurchasedPlayer> purchasedPlayers = results.stream()
                .filter(result -> "SOLD".equalsIgnoreCase(
                        result.getResultStatus()))
                .filter(result -> result.getPlayer() != null)
                .map(result -> new PurchasedPlayer(
                        result.getPlayer().getId(),
                        result.getPlayer().getFullName(),
                        result.getPlayer().getPlayerRole(),
                        result.getFinalPrice(),
                        result.getFinalizedAt()))
                .toList();

        // Step 7: Calculate total spent
        BigDecimal totalSpent = purchasedPlayers.stream()
                .map(PurchasedPlayer::purchasePrice)
                .filter(price -> price != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Step 8: Get remaining budget
        BigDecimal remainingBudget = team.getRemainingBudget();

        if (remainingBudget == null) {
            remainingBudget = BigDecimal.ZERO;
        }

        // Step 9: Return response
        return new TeamSquadResponse(
                team.getId(),
                auction.getId(),
                team.getTeamName(),
                team.getTeamShortName(),
                purchasedPlayers,
                totalSpent,
                remainingBudget,
                purchasedPlayers.size()
        );
    }
}

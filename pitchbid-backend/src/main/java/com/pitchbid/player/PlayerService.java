
package com.pitchbid.player;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.player.dto.PlayerResponse;
import com.pitchbid.player.dto.UpdatePlayerRequest;
import com.pitchbid.team.Team;
import com.pitchbid.team.TeamRepository;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final AuctionRepository auctionRepository;
    private final TeamRepository teamRepository;

    public PlayerService(
            PlayerRepository playerRepository,
            AuctionRepository auctionRepository,
            TeamRepository teamRepository) {

        this.playerRepository = playerRepository;
        this.auctionRepository = auctionRepository;
        this.teamRepository = teamRepository;
    }

    // =========================================================
    // 1. GET INDIVIDUAL PLAYER BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public PlayerResponse getPlayerById(
            Long auctionId,
            Long playerId,
            String creatorEmail) {

        Auction auction = getAuctionAndVerifyCreator(
                auctionId, creatorEmail);

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Player not found"));

        if (!player.getAuction().getId().equals(auction.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Player not found in this auction");
        }

        return toPlayerResponse(player);
    }

    // =========================================================
    // 2. GET ALL AUCTION-ELIGIBLE PLAYERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<PlayerResponse> getAuctionEligiblePlayers(
            Long auctionId,
            String creatorEmail) {

        getAuctionAndVerifyCreator(auctionId, creatorEmail);

        return playerRepository
                .findByAuctionIdAndRegistrationTypeAndStatusOrderByRegisteredAtDesc(
                        auctionId,
                        "INDIVIDUAL",
                        "APPROVED"
                )
                .stream()

                // Base price must exist and be greater than zero.
                .filter(player ->
                        player.getBasePrice() != null
                        && player.getBasePrice().compareTo(
                                BigDecimal.ZERO) > 0
                )

                .map(this::toPlayerResponse)
                .toList();
    }

    // =========================================================
    // 3. GET AUCTION-ELIGIBLE PLAYERS BY CRICKET ROLE
    // =========================================================

    @Transactional(readOnly = true)
    public List<PlayerResponse> getPlayersByRole(
            Long auctionId,
            String role,
            String creatorEmail) {

        getAuctionAndVerifyCreator(auctionId, creatorEmail);

        if (role == null || role.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Player role is required");
        }

        String normalizedRole = role.trim().toUpperCase(Locale.ROOT);

        List<String> allowedRoles = List.of(
                "BATSMAN",
                "BOWLER",
                "ALL_ROUNDER",
                "WICKET_KEEPER"
        );

        if (!allowedRoles.contains(normalizedRole)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid player role. Allowed values: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER");
        }

        return playerRepository
                .findByAuctionIdAndPlayerRoleIgnoreCaseAndStatusOrderByRegisteredAtDesc(
                        auctionId,
                        normalizedRole,
                        "APPROVED"
                )
                .stream()

                // Exclude owner players.
                .filter(player ->
                        "INDIVIDUAL".equalsIgnoreCase(
                                player.getRegistrationType())
                )

                // Exclude players without a valid base price.
                .filter(player ->
                        player.getBasePrice() != null
                        && player.getBasePrice().compareTo(
                                BigDecimal.ZERO) > 0
                )

                .map(this::toPlayerResponse)
                .toList();
    }

    // =========================================================
    // 4. GET ALL PLAYERS BELONGING TO A TEAM
    // =========================================================

    @Transactional(readOnly = true)
    public List<PlayerResponse> getPlayersByTeam(
            Long auctionId,
            Long teamId,
            String creatorEmail) {

        Auction auction = getAuctionAndVerifyCreator(
                auctionId, creatorEmail);

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Team not found"));

        if (team.getAuction() == null
                || !team.getAuction().getId().equals(auction.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Team not found in this auction");
        }

        return playerRepository.findByTeamId(teamId)
                .stream()
                .map(this::toPlayerResponse)
                .toList();
    }

    // =========================================================
    // 5. UPDATE PLAYER DETAILS
    // =========================================================

    @Transactional
    public PlayerResponse updatePlayerDetails(
            Long auctionId,
            Long playerId,
            UpdatePlayerRequest request,
            String creatorEmail) {

        Auction auction = getAuctionAndVerifyCreator(
                auctionId, creatorEmail);

        if (!"UPCOMING".equalsIgnoreCase(auction.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Player details can only be updated when the auction is UPCOMING");
        }

        if (request == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Player update details are required");
        }

        if (request.fullName() == null
                || request.fullName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Player name is required");
        }

        if (request.playerRole() == null
                || request.playerRole().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Player role is required");
        }

        if (request.wicketkeeper() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Wicketkeeper field is required");
        }

        String normalizedRole = request.playerRole()
                .trim()
                .toUpperCase(Locale.ROOT);

        List<String> allowedRoles = List.of(
                "BATSMAN",
                "BOWLER",
                "ALL_ROUNDER",
                "WICKET_KEEPER"
        );

        if (!allowedRoles.contains(normalizedRole)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid player role. Allowed values: BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER");
        }

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Player not found"));

        if (!player.getAuction().getId().equals(auctionId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Player not found in this auction");
        }

        // Update only profile fields.
        // Base price must never be modified here.

        player.setFullName(request.fullName().trim());
        player.setPhone(request.phone());
        player.setDateOfBirth(request.dateOfBirth());
        player.setGender(request.gender());
        player.setCity(request.city());
        player.setPlayerRole(normalizedRole);
        player.setBattingStyle(request.battingStyle());
        player.setBowlingStyle(request.bowlingStyle());
        player.setWicketkeeper(request.wicketkeeper());

        Player updatedPlayer = playerRepository.save(player);

        return toPlayerResponse(updatedPlayer);
    }

    // =========================================================
    // 6. VERIFY AUCTION AND CREATOR OWNERSHIP
    // =========================================================

    private Auction getAuctionAndVerifyCreator(
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

        return auction;
    }

    // =========================================================
    // 7. CONVERT PLAYER ENTITY TO RESPONSE DTO
    // =========================================================

    private PlayerResponse toPlayerResponse(Player player) {

        return new PlayerResponse(
                player.getId(),
                player.getAuction().getId(),
                player.getTeam() != null
                        ? player.getTeam().getId()
                        : null,
                player.getPlayerNumber(),
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

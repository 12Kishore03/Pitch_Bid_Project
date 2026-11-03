
package com.pitchbid.player;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitchbid.player.dto.PlayerResponse;
import com.pitchbid.player.dto.UpdatePlayerRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auctions/{auctionId}/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    // =========================================================
    // 1. UPDATE PLAYER DETAILS
    // =========================================================

    @PutMapping("/{playerId}")
    public ResponseEntity<PlayerResponse> updatePlayerDetails(
            @PathVariable Long auctionId,
            @PathVariable Long playerId,
            @Valid @RequestBody UpdatePlayerRequest request,
            Authentication authentication) {

        String creatorEmail = authentication.getName();

        PlayerResponse response = playerService.updatePlayerDetails(
                auctionId,
                playerId,
                request,
                creatorEmail
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
// 2. GET AUCTION-ELIGIBLE PLAYER POOL
// =========================================================

@GetMapping("/auction-pool")
public ResponseEntity<List<PlayerResponse>> getAuctionEligiblePlayers(
        @PathVariable Long auctionId,
        Authentication authentication) {

    String creatorEmail = authentication.getName();

    List<PlayerResponse> players =
            playerService.getAuctionEligiblePlayers(
                    auctionId,
                    creatorEmail
            );

    return ResponseEntity.ok(players);
}
}

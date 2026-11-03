
package com.pitchbid.registration;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pitchbid.player.PlayerService;
import com.pitchbid.player.dto.PlayerResponse;
import com.pitchbid.registration.dto.PlayerRegistrationDetailsResponse;
import com.pitchbid.registration.dto.PlayerRegistrationRequest;
import com.pitchbid.registration.dto.PlayerRegistrationResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auctions/{auctionId}/player-registrations")
public class PlayerRegistrationController {

    private final PlayerRegistrationService playerRegistrationService;
    private final PlayerService playerService;

    public PlayerRegistrationController(
            PlayerRegistrationService playerRegistrationService,
            PlayerService playerService) {

        this.playerRegistrationService = playerRegistrationService;
        this.playerService = playerService;
    }

    // 1. Public: register an individual player.
    @PostMapping
    public ResponseEntity<PlayerRegistrationResponse> registerPlayer(
            @PathVariable Long auctionId,
            @Valid @RequestBody PlayerRegistrationRequest request) {

        PlayerRegistrationResponse response =
                playerRegistrationService.registerPlayer(auctionId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. Protected: retrieve all registrations or filter by status.
    @GetMapping
    public ResponseEntity<List<PlayerRegistrationDetailsResponse>>
            getPlayerRegistrations(
                    @PathVariable Long auctionId,
                    @RequestParam(required = false) String status,
                    Principal principal) {

        String creatorEmail = principal.getName();

        List<PlayerRegistrationDetailsResponse> registrations;

        if (status == null || status.isBlank()) {
            registrations = playerRegistrationService
                    .getPlayerRegistrations(auctionId, creatorEmail);
        } else {
            registrations = playerRegistrationService
                    .getPlayerRegistrationsByStatus(
                            auctionId, status, creatorEmail);
        }

        return ResponseEntity.ok(registrations);
    }

    // 3. Protected: get an individual player by ID.
    @GetMapping("/{playerId}")
    public ResponseEntity<PlayerResponse> getPlayerById(
            @PathVariable Long auctionId,
            @PathVariable Long playerId,
            Principal principal) {

        PlayerResponse response = playerService.getPlayerById(
                auctionId,
                playerId,
                principal.getName()
        );

        return ResponseEntity.ok(response);
    }

    // 4. Protected: approve a pending player registration.
    @PatchMapping("/{playerId}/approve")
    public ResponseEntity<PlayerRegistrationDetailsResponse>
            approvePlayerRegistration(
                    @PathVariable Long auctionId,
                    @PathVariable Long playerId,
                    Principal principal) {

        PlayerRegistrationDetailsResponse response =
                playerRegistrationService.approvePlayerRegistration(
                        auctionId, playerId, principal.getName());

        return ResponseEntity.ok(response);
    }

    // 5. Protected: reject a pending player registration.
    @PatchMapping("/{playerId}/reject")
    public ResponseEntity<PlayerRegistrationDetailsResponse>
            rejectPlayerRegistration(
                    @PathVariable Long auctionId,
                    @PathVariable Long playerId,
                    Principal principal) {

        PlayerRegistrationDetailsResponse response =
                playerRegistrationService.rejectPlayerRegistration(
                        auctionId, playerId, principal.getName());

        return ResponseEntity.ok(response);
    }

    // 6. Protected: get approved players filtered by cricket role.
@GetMapping("/players")
public ResponseEntity<List<PlayerResponse>> getPlayersByRole(
        @PathVariable Long auctionId,
        @RequestParam String role,
        Principal principal) {

    List<PlayerResponse> players =
            playerService.getPlayersByRole(
                    auctionId,
                    role,
                    principal.getName()
            );

    return ResponseEntity.ok(players);
}


}


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

import com.pitchbid.registration.dto.TeamOwnerRegistrationDetailsResponse;
import com.pitchbid.registration.dto.TeamOwnerRegistrationRequest;
import com.pitchbid.registration.dto.TeamOwnerRegistrationResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auctions/{auctionId}/team-registrations")
public class TeamOwnerRegistrationController {

    private final TeamOwnerRegistrationService registrationService;

    public TeamOwnerRegistrationController(
            TeamOwnerRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    // Public: register a team owner and create their team.
    @PostMapping
    public ResponseEntity<TeamOwnerRegistrationResponse> registerTeamOwner(
            @PathVariable Long auctionId,
            @Valid @RequestBody TeamOwnerRegistrationRequest request) {

        TeamOwnerRegistrationResponse response =
                registrationService.registerTeamOwner(auctionId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Protected: get all team-owner registrations or filter by status.
    @GetMapping
    public ResponseEntity<List<TeamOwnerRegistrationDetailsResponse>>
            getTeamOwnerRegistrations(
                    @PathVariable Long auctionId,
                    @RequestParam(required = false) String status,
                    Principal principal) {

        String creatorEmail = principal.getName();

        List<TeamOwnerRegistrationDetailsResponse> registrations;

        if (status == null || status.isBlank()) {
            registrations = registrationService
                    .getTeamOwnerRegistrations(auctionId, creatorEmail);
        } else {
            registrations = registrationService
                    .getTeamOwnerRegistrationsByStatus(
                            auctionId, status, creatorEmail);
        }

        return ResponseEntity.ok(registrations);
    }

    // Protected: approve a pending team-owner registration.
    @PatchMapping("/{registrationId}/approve")
    public ResponseEntity<TeamOwnerRegistrationDetailsResponse>
            approveTeamOwnerRegistration(
                    @PathVariable Long auctionId,
                    @PathVariable Long registrationId,
                    Principal principal) {

        TeamOwnerRegistrationDetailsResponse response =
                registrationService.approveTeamOwnerRegistration(
                        auctionId,
                        registrationId,
                        principal.getName());

        return ResponseEntity.ok(response);
    }

    // Protected: reject a pending team-owner registration.
    @PatchMapping("/{registrationId}/reject")
    public ResponseEntity<TeamOwnerRegistrationDetailsResponse>
            rejectTeamOwnerRegistration(
                    @PathVariable Long auctionId,
                    @PathVariable Long registrationId,
                    Principal principal) {

        TeamOwnerRegistrationDetailsResponse response =
                registrationService.rejectTeamOwnerRegistration(
                        auctionId,
                        registrationId,
                        principal.getName());

        return ResponseEntity.ok(response);
    }
}

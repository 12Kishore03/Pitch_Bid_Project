
package com.pitchbid.registration;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping
    public ResponseEntity<TeamOwnerRegistrationResponse> registerTeamOwner(
            @PathVariable Long auctionId,
            @Valid @RequestBody TeamOwnerRegistrationRequest request) {

        TeamOwnerRegistrationResponse response =
                registrationService.registerTeamOwner(auctionId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

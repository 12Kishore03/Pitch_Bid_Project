
package com.pitchbid.registration.dto;

import java.time.LocalDateTime;

public record TeamOwnerRegistrationResponse(
        Long registrationId,
        Long auctionId,
        Long teamId,
        Long ownerPlayerId,
        String ownerName,
        String teamName,
        String teamShortName,
        String status,
        Integer ownerPlayerNumber,
        LocalDateTime registeredAt
) {
}

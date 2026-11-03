
package com.pitchbid.registration.dto;

import java.time.LocalDateTime;

public record TeamOwnerRegistrationDetailsResponse(
        Long registrationId,
        Long teamId,
        String ownerName,
        String ownerEmail,
        String ownerPhone,
        String teamName,
        String teamShortName,
        String status,
        LocalDateTime registeredAt
) {}

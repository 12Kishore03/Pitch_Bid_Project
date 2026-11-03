package com.pitchbid.registration.dto;

import java.time.LocalDateTime;

public record PlayerRegistrationResponse(
        Long playerId,
        Long auctionId,
        String fullName,
        String email,
        String registrationType,
        String status,
        LocalDateTime registeredAt
) {}
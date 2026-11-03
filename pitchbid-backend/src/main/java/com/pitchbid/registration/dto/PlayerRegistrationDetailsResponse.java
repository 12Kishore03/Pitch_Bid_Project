
package com.pitchbid.registration.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PlayerRegistrationDetailsResponse(

        Long playerId,
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String city,
        String playerRole,
        String battingStyle,
        String bowlingStyle,
        Boolean wicketkeeper,
        String registrationType,
        String status,
        LocalDateTime registeredAt,
        BigDecimal basePrice

) {}

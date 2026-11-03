
package com.pitchbid.player.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PlayerResponse(

    Long id,
    Long auctionId,
    Long teamId,
    Integer playerNumber,

    String fullName,
    String email,
    String phone,

    LocalDate dateOfBirth,
    String gender,
    String city,

    String playerRole,
    String battingStyle,
    String bowlingStyle,

    boolean wicketkeeper,

    String registrationType,
    String status,

    LocalDateTime registeredAt,

    BigDecimal basePrice

) {}


package com.pitchbid.team.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TeamResponse(

        Long id,

        Long auctionId,

        String ownerName,
        String ownerEmail,
        String ownerPhone,

        String teamName,
        String teamShortName,
        String teamCity,
        String teamDescription,
        String teamLogoPath,

        BigDecimal remainingBudget,

        String status,

        LocalDateTime registeredAt

) {
}

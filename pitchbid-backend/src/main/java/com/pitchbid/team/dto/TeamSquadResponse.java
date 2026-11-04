
package com.pitchbid.team.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record TeamSquadResponse(

        Long teamId,

        Long auctionId,

        String teamName,

        String teamShortName,

        List<PurchasedPlayer> purchasedPlayers,

        BigDecimal totalSpent,

        BigDecimal remainingBudget,

        int totalPlayers

) {

    public record PurchasedPlayer(

            Long playerId,

            String playerName,

            String playerRole,

            BigDecimal purchasePrice,

            LocalDateTime purchasedAt

    ) {
    }
}

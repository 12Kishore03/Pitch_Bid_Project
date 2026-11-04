
package com.pitchbid.liveauction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.pitchbid.liveauction.AuctionResult;

public record AuctionResultResponse(

        Long id,
        Long auctionId,

        PlayerSummary player,
        TeamSummary team,

        BigDecimal finalPrice,
        String resultStatus,
        LocalDateTime finalizedAt

) {

    public record PlayerSummary(
            Long id,
            String fullName,
            String playerRole
    ) {}

    public record TeamSummary(
            Long id,
            String teamName,
            String teamShortName
    ) {}

    public static AuctionResultResponse from(AuctionResult result) {

        PlayerSummary player = null;

        if (result.getPlayer() != null) {
            player = new PlayerSummary(
                    result.getPlayer().getId(),
                    result.getPlayer().getFullName(),
                    result.getPlayer().getPlayerRole()
            );
        }

        TeamSummary team = null;

        if (result.getTeam() != null) {
            team = new TeamSummary(
                    result.getTeam().getId(),
                    result.getTeam().getTeamName(),
                    result.getTeam().getTeamShortName()
            );
        }

        return new AuctionResultResponse(
                result.getId(),
                result.getAuction().getId(),
                player,
                team,
                result.getFinalPrice(),
                result.getResultStatus(),
                result.getFinalizedAt()
        );
    }
}

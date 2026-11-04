
package com.pitchbid.liveauction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.pitchbid.liveauction.AuctionSession;

public record AuctionSessionResponse(

        Long id,
        Long auctionId,

        PlayerSummary currentPlayer,
        BigDecimal currentBid,
        TeamSummary highestBidTeam,

        LocalDateTime bidStartedAt,
        LocalDateTime bidExpiresAt,
        Integer remainingSeconds,

        String sessionStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {

    public record PlayerSummary(
            Long id,
            String fullName,
            String playerRole,
            BigDecimal basePrice
    ) {}

    public record TeamSummary(
            Long id,
            String teamName,
            String teamShortName
    ) {}

    public static AuctionSessionResponse from(AuctionSession session) {

        PlayerSummary player = null;

        if (session.getCurrentPlayer() != null) {

            player = new PlayerSummary(
                    session.getCurrentPlayer().getId(),
                    session.getCurrentPlayer().getFullName(),
                    session.getCurrentPlayer().getPlayerRole(),
                    session.getCurrentPlayer().getBasePrice()
            );
        }

        TeamSummary team = null;

        if (session.getHighestBidTeam() != null) {

            team = new TeamSummary(
                    session.getHighestBidTeam().getId(),
                    session.getHighestBidTeam().getTeamName(),
                    session.getHighestBidTeam().getTeamShortName()
            );
        }

        Integer remainingSeconds = session.getRemainingSeconds();

        if ("READY".equalsIgnoreCase(session.getSessionStatus())) {
            remainingSeconds = 0;
        }

        return new AuctionSessionResponse(
                session.getId(),
                session.getAuction().getId(),
                player,
                session.getCurrentBid(),
                team,
                session.getBidStartedAt(),
                session.getBidExpiresAt(),
                remainingSeconds,
                session.getSessionStatus(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}


package com.pitchbid.auction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AuctionResponse(
        Long id,
        String auctionName,
        String category,
        String visibility,
        String description,
        LocalDateTime startDate,
        LocalDateTime registrationDeadline,
        LocalDateTime endDate,
        String timeZone,
        Integer numberOfTeams,
        BigDecimal teamBudget,
        Integer minPlayers,
        Integer maxPlayers,
        Integer maxAuctionPlayers,
        BigDecimal bidIncrement,
        Integer bidTimer,
        String status,
        String creatorEmail
) {}

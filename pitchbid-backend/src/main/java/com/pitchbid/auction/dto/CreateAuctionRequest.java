
package com.pitchbid.auction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAuctionRequest(

        @NotBlank(message = "Auction name is required")
        @Size(max = 150, message = "Auction name cannot exceed 150 characters")
        String auctionName,

        @NotBlank(message = "Auction category is required")
        @Size(max = 100, message = "Category cannot exceed 100 characters")
        String category,

        @NotBlank(message = "Auction visibility is required")
        @Size(max = 30, message = "Visibility cannot exceed 30 characters")
        String visibility,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        @NotNull(message = "Auction start date and time are required")
        LocalDateTime startDate,

        @NotNull(message = "Registration deadline is required")
        LocalDateTime registrationDeadline,

        LocalDateTime endDate,

        @Size(max = 60, message = "Time zone cannot exceed 60 characters")
        String timeZone,

        @NotNull(message = "Number of teams is required")
        @Min(value = 2, message = "Number of teams must be at least 2")
        Integer numberOfTeams,

        @NotNull(message = "Team budget is required")
        @DecimalMin(value = "0.01",
                message = "Team budget must be greater than zero")
        BigDecimal teamBudget,

        @NotNull(message = "Minimum players per team is required")
        @Min(value = 1,
                message = "Minimum players per team must be at least 1")
        Integer minPlayers,

        @NotNull(message = "Maximum players per team is required")
        @Min(value = 1,
                message = "Maximum players per team must be at least 1")
        Integer maxPlayers,

        @NotNull(message = "Maximum auction players is required")
        @Min(value = 1,
                message = "Maximum auction players must be at least 1")
        Integer maxAuctionPlayers,

        @NotNull(message = "Bid increment is required")
        @DecimalMin(value = "0.01",
                message = "Bid increment must be greater than zero")
        BigDecimal bidIncrement,

        @NotNull(message = "Bid timer is required")
        @Min(value = 5,
                message = "Bid timer must be at least 5 seconds")
        Integer bidTimer,

        Boolean allowTeamPass,

        Boolean playerReentry,

        Boolean teamRegistration,

        Boolean playerRegistration,

        @Size(max = 30,
                message = "Player approval setting cannot exceed 30 characters")
        String playerApproval,

        @Size(max = 30,
                message = "Registration approval setting cannot exceed 30 characters")
        String registrationApproval,

        @Size(max = 50,
                message = "Bid cancellation setting cannot exceed 50 characters")
        String bidCancellation,

        @Size(max = 3000,
                message = "Custom rules cannot exceed 3000 characters")
        String customRules

) {}

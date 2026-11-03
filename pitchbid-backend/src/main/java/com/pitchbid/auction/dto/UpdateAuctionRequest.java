package com.pitchbid.auction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAuctionRequest(

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

        @Size(max = 3000, message = "Custom rules cannot exceed 3000 characters")
        String customRules

) {}
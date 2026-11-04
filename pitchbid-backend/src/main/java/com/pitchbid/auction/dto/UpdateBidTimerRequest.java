
package com.pitchbid.auction.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateBidTimerRequest(

        @NotNull(message = "Bid timer is required")
        @Min(value = 5, message = "Bid timer must be at least 5 seconds")
        @Max(value = 300, message = "Bid timer cannot exceed 300 seconds")
        Integer bidTimer

) {}

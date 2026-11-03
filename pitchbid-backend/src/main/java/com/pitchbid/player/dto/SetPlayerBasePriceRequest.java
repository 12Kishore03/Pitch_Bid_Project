
package com.pitchbid.player.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record SetPlayerBasePriceRequest(

    @NotNull(message = "Base price is required")
    @DecimalMin(
        value = "0.01",
        message = "Base price must be greater than zero"
    )
    @Digits(
        integer = 13,
        fraction = 2,
        message = "Base price can have a maximum of 2 decimal places"
    )
    BigDecimal basePrice

) {}

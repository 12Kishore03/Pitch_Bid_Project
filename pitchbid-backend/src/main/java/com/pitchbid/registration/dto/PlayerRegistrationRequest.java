
package com.pitchbid.registration.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public record PlayerRegistrationRequest(

        @NotBlank(message = "Full name is required")
        @Size(max = 100)
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 150)
        String email,

        @NotBlank(message = "Phone number is required")
        @Size(max = 20)
        String phone,

        @NotNull(message = "Date of birth is required")
        @Past(message = "Date of birth must be in the past")
        LocalDate dateOfBirth,

        @NotBlank(message = "Gender is required")
        @Size(max = 30)
        String gender,

        @NotBlank(message = "City is required")
        @Size(max = 100)
        String city,

        @NotBlank(message = "Player role is required")
        @Size(max = 50)
        String playerRole,

        @NotBlank(message = "Batting style is required")
        @Size(max = 50)
        String battingStyle,

        @NotBlank(message = "Bowling style is required")
        @Size(max = 50)
        String bowlingStyle,

        @NotNull(message = "Wicketkeeper selection is required")
        Boolean wicketkeeper,

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

) {
}

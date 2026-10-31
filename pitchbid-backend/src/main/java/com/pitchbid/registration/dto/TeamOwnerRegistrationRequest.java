
package com.pitchbid.registration.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TeamOwnerRegistrationRequest(

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
        LocalDate dateOfBirth,

        @NotBlank(message = "Gender is required")
        @Size(max = 20)
        String gender,

        @NotBlank(message = "City is required")
        @Size(max = 100)
        String city,

        @NotBlank(message = "Team name is required")
        @Size(max = 100)
        String teamName,

        @NotBlank(message = "Team short name is required")
        @Size(max = 5, message = "Team short name cannot exceed 5 characters")
        String teamShortName,

        @NotBlank(message = "Team city is required")
        @Size(max = 100)
        String teamCity,

        @Size(max = 1000)
        String teamDescription,

        @NotBlank(message = "Player role is required")
        @Size(max = 30)
        String playerRole,

        @NotBlank(message = "Batting style is required")
        @Size(max = 30)
        String battingStyle,

        @NotBlank(message = "Bowling style is required")
        @Size(max = 30)
        String bowlingStyle,

        @NotNull(message = "Wicketkeeper selection is required")
        Boolean wicketkeeper

) {
}

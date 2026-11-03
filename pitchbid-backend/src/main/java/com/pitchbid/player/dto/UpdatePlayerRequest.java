package com.pitchbid.player.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdatePlayerRequest(

        @NotBlank(message = "Player name is required")
        @Size(max = 100, message = "Player name cannot exceed 100 characters")
        String fullName,

        @Size(max = 20, message = "Phone number cannot exceed 20 characters")
        String phone,

        LocalDate dateOfBirth,

        @Size(max = 30, message = "Gender cannot exceed 30 characters")
        String gender,

        @Size(max = 100, message = "City cannot exceed 100 characters")
        String city,

        @NotBlank(message = "Player role is required")
        @Size(max = 50, message = "Player role cannot exceed 50 characters")
        String playerRole,

        @Size(max = 50, message = "Batting style cannot exceed 50 characters")
        String battingStyle,

        @Size(max = 50, message = "Bowling style cannot exceed 50 characters")
        String bowlingStyle,

        @NotNull(message = "Wicketkeeper field is required")
        Boolean wicketkeeper

) {}
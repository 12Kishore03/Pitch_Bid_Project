
package com.pitchbid.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTeamRequest(

        @NotBlank(message = "Team name is required")
        @Size(max = 100, message = "Team name cannot exceed 100 characters")
        String teamName,

        @NotBlank(message = "Team short name is required")
        @Size(max = 20, message = "Team short name cannot exceed 20 characters")
        String teamShortName,

        @Size(max = 100, message = "Team city cannot exceed 100 characters")
        String teamCity,

        @Size(max = 1000, message = "Team description cannot exceed 1000 characters")
        String teamDescription,

        @Size(max = 500, message = "Team logo path cannot exceed 500 characters")
        String teamLogoPath

) {
}

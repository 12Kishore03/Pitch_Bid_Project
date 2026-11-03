
package com.pitchbid.team;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pitchbid.player.PlayerService;
import com.pitchbid.player.dto.PlayerResponse;
import com.pitchbid.team.dto.TeamResponse;
import com.pitchbid.team.dto.UpdateTeamRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auctions/{auctionId}/teams")
public class TeamController {

    private final TeamService teamService;
    private final PlayerService playerService;

    public TeamController(TeamService teamService, PlayerService playerService) {
        this.teamService = teamService;
        this.playerService = playerService;
    }

    // GET ALL TEAMS OR FILTER BY STATUS

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getTeams(
            @PathVariable Long auctionId,
            @RequestParam(required = false) String status,
            Principal principal) {

        List<TeamResponse> teams = teamService.getTeams(
                auctionId,
                status,
                principal.getName()
        );

        return ResponseEntity.ok(teams);
    }

    // GET A SPECIFIC TEAM

    @GetMapping("/{teamId}")
    public ResponseEntity<TeamResponse> getTeamById(
            @PathVariable Long auctionId,
            @PathVariable Long teamId,
            Principal principal) {

        TeamResponse team = teamService.getTeamById(
                auctionId,
                teamId,
                principal.getName()
        );

        return ResponseEntity.ok(team);
    }

    
    // UPDATE TEAM DETAILS

    @PutMapping("/{teamId}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Long auctionId,
            @PathVariable Long teamId,
            @Valid @RequestBody UpdateTeamRequest request,
            Principal principal) {

        TeamResponse updatedTeam = teamService.updateTeam(
                auctionId,
                teamId,
                request,
                principal.getName()
        );

        return ResponseEntity.ok(updatedTeam);
    }
// GET ALL PLAYERS BELONGING TO A TEAM
        // =========================================================
    // GET ALL PLAYERS BELONGING TO A TEAM
    // =========================================================

    @GetMapping("/{teamId}/players")
    public ResponseEntity<List<PlayerResponse>> getPlayersByTeam(
            @PathVariable Long auctionId,
            @PathVariable Long teamId,
            Principal principal) {

        List<PlayerResponse> players =
                playerService.getPlayersByTeam(
                        auctionId,
                        teamId,
                        principal.getName()
                );

        return ResponseEntity.ok(players);
    }

}

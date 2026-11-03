
package com.pitchbid.liveauction;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auctions/{auctionId}/session")
public class AuctionSessionController {

    private final AuctionSessionService sessionService;

    public AuctionSessionController(
            AuctionSessionService sessionService) {

        this.sessionService = sessionService;
    }

    // 1. CREATE OR GET EXISTING SESSION

    @PostMapping
    public ResponseEntity<AuctionSession> createSession(
            @PathVariable Long auctionId,
            Principal principal) {

        AuctionSession session = sessionService.createSession(
                auctionId,
                principal.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(session);
    }

    // 2. GET EXISTING SESSION

    @GetMapping
    public ResponseEntity<AuctionSession> getSession(
            @PathVariable Long auctionId,
            Principal principal) {

        AuctionSession session = sessionService.getSession(
                auctionId,
                principal.getName()
        );

        return ResponseEntity.ok(session);
    }

    // 3. SELECT PLAYER AND START BIDDING

    @PostMapping("/players/{playerId}")
    public ResponseEntity<AuctionSession> selectPlayer(
            @PathVariable Long auctionId,
            @PathVariable Long playerId,
            Principal principal) {

        AuctionSession session = sessionService.selectPlayer(
                auctionId,
                playerId,
                principal.getName()
        );

        return ResponseEntity.ok(session);
    }

    // 4. RAISE BID

    @PostMapping("/raise-bid/{teamId}")
    public ResponseEntity<AuctionSession> raiseBid(
            @PathVariable Long auctionId,
            @PathVariable Long teamId,
            Principal principal) {

        AuctionSession session = sessionService.raiseBid(
                auctionId,
                teamId,
                principal.getName()
        );

        return ResponseEntity.ok(session);
    }
}

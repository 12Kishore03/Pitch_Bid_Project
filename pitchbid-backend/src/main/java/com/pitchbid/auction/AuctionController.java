
package com.pitchbid.auction;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitchbid.auction.dto.AuctionResponse;
import com.pitchbid.auction.dto.CreateAuctionRequest;
import com.pitchbid.auction.dto.UpdateAuctionRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    // ==========================================
    // 1. CREATE AUCTION
    // POST /api/auctions
    // ==========================================

    @PostMapping
    public ResponseEntity<AuctionResponse> createAuction(
            @Valid @RequestBody CreateAuctionRequest request,
            Principal principal) {

        AuctionResponse response = auctionService.createAuction(
                request,
                principal.getName()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // 2. GET ALL AUCTIONS CREATED BY CURRENT USER
    // GET /api/auctions/mine
    // ==========================================

    @GetMapping("/mine")
    public ResponseEntity<List<AuctionResponse>> getMyAuctions(
            Principal principal) {

        List<AuctionResponse> auctions =
                auctionService.getAuctionsByCreator(principal.getName());

        return ResponseEntity.ok(auctions);
    }

    // ==========================================
    // 3. GET AUCTION BY ID
    // GET /api/auctions/{auctionId}
    // ==========================================

    @GetMapping("/{auctionId}")
    public ResponseEntity<AuctionResponse> getAuctionById(
            @PathVariable Long auctionId,
            Principal principal) {

        AuctionResponse response = auctionService.getAuctionById(
                auctionId,
                principal.getName()
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 4. UPDATE AUCTION BASIC DETAILS
    // PUT /api/auctions/{auctionId}
    // UPCOMING ONLY
    // ==========================================

    @PutMapping("/{auctionId}")
    public ResponseEntity<AuctionResponse> updateAuction(
            @PathVariable Long auctionId,
            @Valid @RequestBody UpdateAuctionRequest request,
            Principal principal) {

        AuctionResponse response = auctionService.updateAuction(
                auctionId,
                request,
                principal.getName()
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 5. START AUCTION
    // PATCH /api/auctions/{auctionId}/start
    // UPCOMING -> LIVE
    // ==========================================

    @PatchMapping("/{auctionId}/start")
    public ResponseEntity<AuctionResponse> startAuction(
            @PathVariable Long auctionId,
            Principal principal) {

        AuctionResponse response = auctionService.startAuction(
                auctionId,
                principal.getName()
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 6. PAUSE AUCTION
    // PATCH /api/auctions/{auctionId}/pause
    // LIVE -> PAUSED
    // ==========================================

    @PatchMapping("/{auctionId}/pause")
    public ResponseEntity<AuctionResponse> pauseAuction(
            @PathVariable Long auctionId,
            Principal principal) {

        AuctionResponse response = auctionService.pauseAuction(
                auctionId,
                principal.getName()
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 7. RESUME AUCTION
    // PATCH /api/auctions/{auctionId}/resume
    // PAUSED -> LIVE
    // ==========================================

    @PatchMapping("/{auctionId}/resume")
    public ResponseEntity<AuctionResponse> resumeAuction(
            @PathVariable Long auctionId,
            Principal principal) {

        AuctionResponse response = auctionService.resumeAuction(
                auctionId,
                principal.getName()
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 8. STOP AUCTION
    // PATCH /api/auctions/{auctionId}/stop
    // LIVE / PAUSED -> COMPLETED
    // ==========================================

    @PatchMapping("/{auctionId}/stop")
    public ResponseEntity<AuctionResponse> stopAuction(
            @PathVariable Long auctionId,
            Principal principal) {

        AuctionResponse response = auctionService.stopAuction(
                auctionId,
                principal.getName()
        );

        return ResponseEntity.ok(response);
    }
}

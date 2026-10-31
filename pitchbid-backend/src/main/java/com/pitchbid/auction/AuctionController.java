
package com.pitchbid.auction;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pitchbid.auction.dto.AuctionResponse;
import com.pitchbid.auction.dto.CreateAuctionRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

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

    @GetMapping("/mine")
    public ResponseEntity<List<AuctionResponse>> getMyAuctions(
            Principal principal) {

        List<AuctionResponse> auctions =
                auctionService.getAuctionsByCreator(principal.getName());

        return ResponseEntity.ok(auctions);
    }

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
}

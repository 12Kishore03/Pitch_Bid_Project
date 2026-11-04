
package com.pitchbid.liveauction;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.liveauction.dto.AuctionResultResponse;

@Service
public class AuctionResultService {

    private final AuctionResultRepository resultRepository;
    private final AuctionRepository auctionRepository;

    public AuctionResultService(
            AuctionResultRepository resultRepository,
            AuctionRepository auctionRepository) {

        this.resultRepository = resultRepository;
        this.auctionRepository = auctionRepository;
    }

    // Get all results or filter by SOLD / UNSOLD.
    @Transactional(readOnly = true)
    public List<AuctionResultResponse> getResults(
            Long auctionId,
            String creatorEmail,
            String status) {

        // Step 1: Verify auction ownership.
        findOwnedAuction(auctionId, creatorEmail);

        List<AuctionResult> results;

        // Step 2: Retrieve results.
        if (status == null || status.isBlank()) {

            results = resultRepository
                    .findByAuctionIdOrderByFinalizedAtDesc(auctionId);

        } else {

            String normalizedStatus = status
                    .trim()
                    .toUpperCase(Locale.ROOT);

            if (!normalizedStatus.equals("SOLD")
                    && !normalizedStatus.equals("UNSOLD")) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid result status. Allowed values: SOLD, UNSOLD"
                );
            }

            results = resultRepository
                    .findByAuctionIdAndResultStatusOrderByFinalizedAtDesc(
                            auctionId,
                            normalizedStatus
                    );
        }

        // Step 3: Convert entities into response DTOs.
        return results.stream()
                .map(AuctionResultResponse::from)
                .toList();
    }

    // Verify that the requested auction belongs to this Creator.
    private Auction findOwnedAuction(
            Long auctionId,
            String creatorEmail) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"
                ));

        if (auction.getCreator() == null
                || auction.getCreator().getEmail() == null
                || !auction.getCreator().getEmail()
                        .equalsIgnoreCase(creatorEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to view results for this auction"
            );
        }

        return auction;
    }
}

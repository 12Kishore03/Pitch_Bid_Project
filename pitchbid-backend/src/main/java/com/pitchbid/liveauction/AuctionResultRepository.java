
package com.pitchbid.liveauction;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionResultRepository
        extends JpaRepository<AuctionResult, Long> {

    // Get all finalized results for a particular auction.
    List<AuctionResult> findByAuctionIdOrderByFinalizedAtDesc(
            Long auctionId
    );

    // Get finalized results filtered by status.
    List<AuctionResult> findByAuctionIdAndResultStatusOrderByFinalizedAtDesc(
            Long auctionId,
            String resultStatus
    );

    // Check whether a player has already been finalized.
    boolean existsByAuctionIdAndPlayerId(
            Long auctionId,
            Long playerId
    );

    // Get finalized results belonging to a particular team.
List<AuctionResult> findByAuctionIdAndTeamIdOrderByFinalizedAtDesc(
        Long auctionId,
        Long teamId
);


}

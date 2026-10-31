
package com.pitchbid.team;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    long countByAuctionId(Long auctionId);

    boolean existsByAuctionIdAndTeamNameIgnoreCase(
            Long auctionId,
            String teamName
    );

    boolean existsByAuctionIdAndTeamShortNameIgnoreCase(
            Long auctionId,
            String teamShortName
    );

    boolean existsByAuctionIdAndOwnerId(
            Long auctionId,
            Long ownerId
    );

    List<Team> findByAuctionId(Long auctionId);

    List<Team> findByAuctionIdAndStatus(
            Long auctionId,
            String status
    );
}

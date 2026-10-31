
package com.pitchbid.player;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    long countByAuctionId(Long auctionId);

    boolean existsByAuctionIdAndEmailIgnoreCase(
            Long auctionId, String email);

    boolean existsByTeamIdAndPlayerNumber(
            Long teamId, Integer playerNumber);

    List<Player> findByAuctionId(Long auctionId);

    List<Player> findByTeamId(Long teamId);

    List<Player> findByAuctionIdAndStatus(Long auctionId, String status);
}

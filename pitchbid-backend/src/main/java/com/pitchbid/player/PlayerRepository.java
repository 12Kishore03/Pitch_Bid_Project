
package com.pitchbid.player;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    // Count all players registered for an auction.
    long countByAuctionId(Long auctionId);

    // Check whether an email already exists in an auction.
    boolean existsByAuctionIdAndEmailIgnoreCase(
            Long auctionId,
            String email
    );

    // Check whether a player number already exists in a team.
    boolean existsByTeamIdAndPlayerNumber(
            Long teamId,
            Integer playerNumber
    );

    // Get all players belonging to an auction.
    List<Player> findByAuctionId(Long auctionId);

    // Get all players belonging to a team.
    List<Player> findByTeamId(Long teamId);

    // Get players by auction and registration status.
    List<Player> findByAuctionIdAndStatus(
            Long auctionId,
            String status
    );

    // Count players excluding a particular registration status.
    long countByAuctionIdAndStatusNot(
            Long auctionId,
            String status
    );

    // Get all auction players ordered by registration date.
    List<Player> findByAuctionIdOrderByRegisteredAtDesc(
            Long auctionId
    );

    // Get players by auction and status, ordered by registration date.
    List<Player> findByAuctionIdAndStatusOrderByRegisteredAtDesc(
            Long auctionId,
            String status
    );

    // Find a player by auction and email.
    List<Player> findByAuctionIdAndEmailIgnoreCase(
            Long auctionId,
            String email
    );

    // Get players by auction, cricket role and registration status.
    List<Player> findByAuctionIdAndPlayerRoleIgnoreCaseAndStatusOrderByRegisteredAtDesc(
            Long auctionId,
            String playerRole,
            String status
    );

    // Get players eligible for the auction pool.
    List<Player> findByAuctionIdAndRegistrationTypeAndStatusOrderByRegisteredAtDesc(
            Long auctionId,
            String registrationType,
            String status
    );

}

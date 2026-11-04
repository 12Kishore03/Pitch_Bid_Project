package com.pitchbid.liveauction;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface AuctionSessionRepository
        extends JpaRepository<AuctionSession, Long> {

    Optional<AuctionSession> findByAuctionId(Long auctionId);

    boolean existsByAuctionId(Long auctionId);
}
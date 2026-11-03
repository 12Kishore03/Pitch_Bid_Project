
package com.pitchbid.registration;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamOwnerRegistrationRepository
        extends JpaRepository<TeamOwnerRegistration, Long> {

    long countByAuctionId(Long auctionId);

    boolean existsByAuctionIdAndOwnerEmailIgnoreCase(
            Long auctionId, String ownerEmail);

    Optional<TeamOwnerRegistration> findByAuctionIdAndOwnerEmailIgnoreCase(
            Long auctionId, String ownerEmail);

    List<TeamOwnerRegistration> findByAuctionId(Long auctionId);

    List<TeamOwnerRegistration> findByAuctionIdAndStatus(
            Long auctionId, String status);
    
     List<TeamOwnerRegistration> findByAuctionIdOrderByRegisteredAtDesc(
        Long auctionId);

List<TeamOwnerRegistration> findByAuctionIdAndStatusOrderByRegisteredAtDesc(
        Long auctionId,
        String status);       

            
}

package com.pitchbid.liveauction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.pitchbid.auction.Auction;
import com.pitchbid.player.Player;
import com.pitchbid.team.Team;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "auction_sessions",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_auction_session_auction",
            columnNames = "auction_id"
        )
    }
)
public class AuctionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One live session belongs to one auction
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false, unique = true)
    private Auction auction;

    // Player currently being auctioned
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_player_id")
    private Player currentPlayer;

    // Current highest bid amount
    @Column(name = "current_bid", precision = 15, scale = 2)
    private BigDecimal currentBid;

    // Team that currently holds the highest bid
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "highest_bid_team_id")
    private Team highestBidTeam;

    // Timer information
    @Column(name = "bid_started_at")
    private LocalDateTime bidStartedAt;

    @Column(name = "bid_expires_at")
    private LocalDateTime bidExpiresAt;

    // Used to preserve the countdown when bidding is paused
    @Column(name = "remaining_seconds")
    private Integer remainingSeconds;

    // READY, BIDDING, PAUSED, COMPLETED
    @Column(name = "session_status", nullable = false, length = 30)
    private String sessionStatus = "READY";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected AuctionSession() {
    }

    public AuctionSession(Auction auction) {
        this.auction = auction;
        this.sessionStatus = "READY";
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;

        if (sessionStatus == null) {
            sessionStatus = "READY";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters

    public Long getId() {
        return id;
    }

    public Auction getAuction() {
        return auction;
    }

    public Player getCurrentPlayer() {
        return currentPlayer;
    }

    public BigDecimal getCurrentBid() {
        return currentBid;
    }

    public Team getHighestBidTeam() {
        return highestBidTeam;
    }

    public LocalDateTime getBidStartedAt() {
        return bidStartedAt;
    }

    public LocalDateTime getBidExpiresAt() {
        return bidExpiresAt;
    }

    public Integer getRemainingSeconds() {
        return remainingSeconds;
    }

    public String getSessionStatus() {
        return sessionStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Controlled setters for service-layer operations

    public void setCurrentPlayer(Player currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    public void setCurrentBid(BigDecimal currentBid) {
        this.currentBid = currentBid;
    }

    public void setHighestBidTeam(Team highestBidTeam) {
        this.highestBidTeam = highestBidTeam;
    }

    public void setBidStartedAt(LocalDateTime bidStartedAt) {
        this.bidStartedAt = bidStartedAt;
    }

    public void setBidExpiresAt(LocalDateTime bidExpiresAt) {
        this.bidExpiresAt = bidExpiresAt;
    }

    public void setRemainingSeconds(Integer remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public void setSessionStatus(String sessionStatus) {
        this.sessionStatus = sessionStatus;
    }
}
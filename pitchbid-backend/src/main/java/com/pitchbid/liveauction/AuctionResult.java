
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "auction_results",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_auction_result_player",
            columnNames = {"auction_id", "player_id"}
        )
    }
)
public class AuctionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "final_price", precision = 15, scale = 2)
    private BigDecimal finalPrice;

    @Column(name = "result_status", nullable = false, length = 20)
    private String resultStatus;

    @Column(name = "finalized_at", nullable = false)
    private LocalDateTime finalizedAt;

    protected AuctionResult() {
    }

    public AuctionResult(
            Auction auction,
            Player player,
            Team team,
            BigDecimal finalPrice,
            String resultStatus) {

        this.auction = auction;
        this.player = player;
        this.team = team;
        this.finalPrice = finalPrice;
        this.resultStatus = resultStatus;
    }

    @PrePersist
    protected void onCreate() {
        if (finalizedAt == null) {
            finalizedAt = LocalDateTime.now();
        }
    }

    // Getters

    public Long getId() {
        return id;
    }

    public Auction getAuction() {
        return auction;
    }

    public Player getPlayer() {
        return player;
    }

    public Team getTeam() {
        return team;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public String getResultStatus() {
        return resultStatus;
    }

    public LocalDateTime getFinalizedAt() {
        return finalizedAt;
    }
}

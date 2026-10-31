
package com.pitchbid.team;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.pitchbid.auction.Auction;
import com.pitchbid.user.User;

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
    name = "teams",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_team_auction_name",
            columnNames = {"auction_id", "team_name"}
        ),
        @UniqueConstraint(
            name = "uk_team_auction_short_name",
            columnNames = {"auction_id", "team_short_name"}
        )
    }
)
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @Column(name = "team_name", nullable = false, length = 100)
    private String teamName;

    @Column(name = "team_short_name", nullable = false, length = 5)
    private String teamShortName;

    @Column(nullable = false, length = 100)
    private String teamCity;

    @Column(length = 1000)
    private String teamDescription;

    @Column(length = 500)
    private String teamLogoPath;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingBudget;

    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @Column(nullable = false)
    private LocalDateTime registeredAt;

    protected Team() {
    }

    public Team(
            Auction auction,
            User owner,
            String teamName,
            String teamShortName,
            String teamCity,
            String teamDescription,
            String teamLogoPath) {

        this.auction = auction;
        this.owner = owner;
        this.teamName = teamName;
        this.teamShortName = teamShortName;
        this.teamCity = teamCity;
        this.teamDescription = teamDescription;
        this.teamLogoPath = teamLogoPath;
        this.remainingBudget = auction.getTeamBudget();
        this.status = "PENDING";
    }

    @PrePersist
    protected void onCreate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }

        if (status == null) {
            status = "PENDING";
        }
    }

    public Long getId() {
        return id;
    }

    public Auction getAuction() {
        return auction;
    }

    public User getOwner() {
        return owner;
    }

    public String getTeamName() {
        return teamName;
    }

    public String getTeamShortName() {
        return teamShortName;
    }

    public String getTeamCity() {
        return teamCity;
    }

    public String getTeamDescription() {
        return teamDescription;
    }

    public String getTeamLogoPath() {
        return teamLogoPath;
    }

    public BigDecimal getRemainingBudget() {
        return remainingBudget;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

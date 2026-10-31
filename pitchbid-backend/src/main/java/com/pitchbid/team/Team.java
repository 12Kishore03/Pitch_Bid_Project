
package com.pitchbid.team;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.pitchbid.auction.Auction;

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
        ),
        @UniqueConstraint(
            name = "uk_team_auction_owner_email",
            columnNames = {"auction_id", "owner_email"}
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

    @Column(name = "owner_name", nullable = false, length = 100)
    private String ownerName;

    @Column(name = "owner_email", nullable = false, length = 150)
    private String ownerEmail;

    @Column(name = "owner_phone", nullable = false, length = 20)
    private String ownerPhone;

    @Column(name = "team_name", nullable = false, length = 100)
    private String teamName;

    @Column(name = "team_short_name", nullable = false, length = 20)
    private String teamShortName;

    @Column(name = "team_city", length = 100)
    private String teamCity;

    @Column(name = "team_description", length = 1000)
    private String teamDescription;

    @Column(name = "team_logo_path", length = 500)
    private String teamLogoPath;

    @Column(name = "remaining_budget", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingBudget;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    protected Team() {
    }

    public Team(
            Auction auction,
            String ownerName,
            String ownerEmail,
            String ownerPhone,
            String teamName,
            String teamShortName,
            String teamCity,
            String teamDescription,
            String teamLogoPath) {

        this.auction = auction;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.ownerPhone = ownerPhone;
        this.teamName = teamName;
        this.teamShortName = teamShortName;
        this.teamCity = teamCity;
        this.teamDescription = teamDescription;
        this.teamLogoPath = teamLogoPath;
        this.remainingBudget = auction.getTeamBudget();
        this.status = "PENDING";
        this.registeredAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Auction getAuction() {
        return auction;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public String getOwnerPhone() {
        return ownerPhone;
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

    public void setRemainingBudget(BigDecimal remainingBudget) {
        this.remainingBudget = remainingBudget;
    }
}

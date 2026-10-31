
package com.pitchbid.registration;

import java.time.LocalDateTime;

import com.pitchbid.auction.Auction;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "team_owner_registrations",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_owner_registration_auction_email",
            columnNames = {"auction_id", "owner_email"}
        ),
        @UniqueConstraint(
            name = "uk_owner_registration_team",
            columnNames = {"team_id"}
        )
    }
)
public class TeamOwnerRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "owner_name", nullable = false, length = 100)
    private String ownerName;

    @Column(name = "owner_email", nullable = false, length = 150)
    private String ownerEmail;

    @Column(name = "owner_phone", nullable = false, length = 20)
    private String ownerPhone;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    protected TeamOwnerRegistration() {
    }

    public TeamOwnerRegistration(
            Auction auction,
            Team team,
            String ownerName,
            String ownerEmail,
            String ownerPhone) {

        this.auction = auction;
        this.team = team;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.ownerPhone = ownerPhone;
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

    public Team getTeam() {
        return team;
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

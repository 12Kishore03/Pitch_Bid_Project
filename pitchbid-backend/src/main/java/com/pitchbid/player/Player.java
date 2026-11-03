
package com.pitchbid.player;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "players",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_player_auction_email",
            columnNames = {"auction_id", "email"}
        ),
        @UniqueConstraint(
            name = "uk_player_team_number",
            columnNames = {"team_id", "player_number"}
        )
    }
)
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "team_id", nullable = true)
    private Team team;

    @Column(name = "player_number")
    private Integer playerNumber;

    // Individual base price assigned by Auction Creator
    @Column(name = "base_price", precision = 15, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    private LocalDate dateOfBirth;

    @Column(length = 30)
    private String gender;

    @Column(length = 100)
    private String city;

    @Column(name = "player_role", length = 50)
    private String playerRole;

    @Column(name = "batting_style", length = 50)
    private String battingStyle;

    @Column(name = "bowling_style", length = 50)
    private String bowlingStyle;

    @Column(nullable = false)
    private boolean wicketkeeper;

    @Column(name = "registration_type", nullable = false, length = 30)
    private String registrationType = "INDIVIDUAL";

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    protected Player() {
    }

    public Player(
            Auction auction,
            Team team,
            Integer playerNumber,
            String fullName,
            String email,
            String phone,
            LocalDate dateOfBirth,
            String gender,
            String city,
            String playerRole,
            String battingStyle,
            String bowlingStyle,
            boolean wicketkeeper,
            String registrationType) {

        this.auction = auction;
        this.team = team;
        this.playerNumber = playerNumber;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.city = city;
        this.playerRole = playerRole;
        this.battingStyle = battingStyle;
        this.bowlingStyle = bowlingStyle;
        this.wicketkeeper = wicketkeeper;
        this.registrationType = registrationType;
        this.status = "PENDING";
        this.registeredAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }

    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public Auction getAuction() {
        return auction;
    }

    public Team getTeam() {
        return team;
    }

    public Integer getPlayerNumber() {
        return playerNumber;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public String getCity() {
        return city;
    }

    public String getPlayerRole() {
        return playerRole;
    }

    public String getBattingStyle() {
        return battingStyle;
    }

    public String getBowlingStyle() {
        return bowlingStyle;
    }

    public boolean isWicketkeeper() {
        return wicketkeeper;
    }

    public String getRegistrationType() {
        return registrationType;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    // =========================================================
    // EXISTING CONTROLLED SETTERS
    // =========================================================

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public void setPlayerNumber(Integer playerNumber) {
        this.playerNumber = playerNumber;
    }

    // =========================================================
    // BASE PRICE SETTER
    // =========================================================

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    // =========================================================
    // PLAYER PROFILE SETTERS
    // =========================================================

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setPlayerRole(String playerRole) {
        this.playerRole = playerRole;
    }

    public void setBattingStyle(String battingStyle) {
        this.battingStyle = battingStyle;
    }

    public void setBowlingStyle(String bowlingStyle) {
        this.bowlingStyle = bowlingStyle;
    }

    public void setWicketkeeper(boolean wicketkeeper) {
        this.wicketkeeper = wicketkeeper;
    }
}

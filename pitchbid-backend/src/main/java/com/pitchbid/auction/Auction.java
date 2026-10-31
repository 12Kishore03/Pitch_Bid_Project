
package com.pitchbid.auction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

@Entity
@Table(name = "auctions")
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String auctionName;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 30)
    private String visibility;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime registrationDeadline;

    private LocalDateTime endDate;

    @Column(nullable = false, length = 60)
    private String timeZone = "Asia/Kolkata";

    @Column(nullable = false)
    private Integer numberOfTeams;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal teamBudget;

    @Column(nullable = false)
    private Integer minPlayers;

    @Column(nullable = false)
    private Integer maxPlayers;

    @Column(nullable = false)
    private Integer maxAuctionPlayers;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bidIncrement;

    @Column(nullable = false)
    private Integer bidTimer = 20;

    @Column(nullable = false, length = 30)
    private String status = "UPCOMING";

    @Column(nullable = false)
    private boolean allowTeamPass = true;

    @Column(nullable = false)
    private boolean playerReentry = true;

    @Column(nullable = false)
    private boolean teamRegistration = true;

    @Column(nullable = false)
    private boolean playerRegistration = true;

    @Column(nullable = false, length = 30)
    private String playerApproval = "Manual";

    @Column(nullable = false, length = 30)
    private String registrationApproval = "Manual";

    @Column(nullable = false, length = 50)
    private String bidCancellation = "Creator approval";

    @Column(length = 3000)
    private String customRules;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    protected Auction() {
    }

    public Auction(
            String auctionName,
            String category,
            String visibility,
            String description,
            LocalDateTime startDate,
            LocalDateTime registrationDeadline,
            LocalDateTime endDate,
            String timeZone,
            Integer numberOfTeams,
            BigDecimal teamBudget,
            Integer minPlayers,
            Integer maxPlayers,
            Integer maxAuctionPlayers,
            BigDecimal bidIncrement,
            Integer bidTimer,
            User creator) {

        this.auctionName = auctionName;
        this.category = category;
        this.visibility = visibility;
        this.description = description;
        this.startDate = startDate;
        this.registrationDeadline = registrationDeadline;
        this.endDate = endDate;
        this.timeZone = timeZone;
        this.numberOfTeams = numberOfTeams;
        this.teamBudget = teamBudget;
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
        this.maxAuctionPlayers = maxAuctionPlayers;
        this.bidIncrement = bidIncrement;
        this.bidTimer = bidTimer;
        this.creator = creator;
    }

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = "UPCOMING";
        }
    }

    public Long getId() {
        return id;
    }

    public String getAuctionName() {
        return auctionName;
    }

    public String getCategory() {
        return category;
    }

    public String getVisibility() {
        return visibility;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public LocalDateTime getRegistrationDeadline() {
        return registrationDeadline;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public Integer getNumberOfTeams() {
        return numberOfTeams;
    }

    public BigDecimal getTeamBudget() {
        return teamBudget;
    }

    public Integer getMinPlayers() {
        return minPlayers;
    }

    public Integer getMaxPlayers() {
        return maxPlayers;
    }

    public Integer getMaxAuctionPlayers() {
        return maxAuctionPlayers;
    }

    public BigDecimal getBidIncrement() {
        return bidIncrement;
    }

    public Integer getBidTimer() {
        return bidTimer;
    }

    public String getStatus() {
        return status;
    }

    public boolean isAllowTeamPass() {
        return allowTeamPass;
    }

    public boolean isPlayerReentry() {
        return playerReentry;
    }

    public boolean isTeamRegistration() {
        return teamRegistration;
    }

    public boolean isPlayerRegistration() {
        return playerRegistration;
    }

    public String getPlayerApproval() {
        return playerApproval;
    }

    public String getRegistrationApproval() {
        return registrationApproval;
    }

    public String getBidCancellation() {
        return bidCancellation;
    }

    public String getCustomRules() {
        return customRules;
    }

    public User getCreator() {
        return creator;
    }

    public void setAllowTeamPass(boolean allowTeamPass) {
        this.allowTeamPass = allowTeamPass;
    }

    public void setPlayerReentry(boolean playerReentry) {
        this.playerReentry = playerReentry;
    }

    public void setTeamRegistration(boolean teamRegistration) {
        this.teamRegistration = teamRegistration;
    }

    public void setPlayerRegistration(boolean playerRegistration) {
        this.playerRegistration = playerRegistration;
    }

    public void setPlayerApproval(String playerApproval) {
        this.playerApproval = playerApproval;
    }

    public void setRegistrationApproval(String registrationApproval) {
        this.registrationApproval = registrationApproval;
    }

    public void setBidCancellation(String bidCancellation) {
        this.bidCancellation = bidCancellation;
    }

    public void setCustomRules(String customRules) {
        this.customRules = customRules;
    }
}

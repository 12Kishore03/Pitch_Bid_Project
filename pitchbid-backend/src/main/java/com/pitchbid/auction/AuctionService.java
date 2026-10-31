
package com.pitchbid.auction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.pitchbid.auction.dto.AuctionResponse;
import com.pitchbid.auction.dto.CreateAuctionRequest;
import com.pitchbid.user.User;
import com.pitchbid.user.UserRepository;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;

    public AuctionService(
            AuctionRepository auctionRepository,
            UserRepository userRepository) {
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AuctionResponse createAuction(
            CreateAuctionRequest request,
            String creatorEmail) {

        User creator = userRepository.findByEmailIgnoreCase(creatorEmail)
                .filter(User::isActive)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Creator account not found"
                ));

        validateAuction(request);

        Auction auction = new Auction(
                request.auctionName().trim(),
                request.category().trim(),
                request.visibility().trim(),
                request.description(),
                request.startDate(),
                request.registrationDeadline(),
                request.endDate(),
                defaultTimeZone(request.timeZone()),
                request.numberOfTeams(),
                request.teamBudget(),
                request.minPlayers(),
                request.maxPlayers(),
                request.maxAuctionPlayers(),
                request.bidIncrement(),
                request.bidTimer(),
                creator
        );

        auction.setAllowTeamPass(
                request.allowTeamPass() == null
                        || request.allowTeamPass());

        auction.setPlayerReentry(
                request.playerReentry() == null
                        || request.playerReentry());

        auction.setTeamRegistration(
                request.teamRegistration() == null
                        || request.teamRegistration());

        auction.setPlayerRegistration(
                request.playerRegistration() == null
                        || request.playerRegistration());

        auction.setPlayerApproval(
                defaultText(request.playerApproval(), "Manual"));

        auction.setRegistrationApproval(
                defaultText(request.registrationApproval(), "Manual"));

        auction.setBidCancellation(
                defaultText(request.bidCancellation(), "Creator approval"));

        auction.setCustomRules(request.customRules());

        Auction savedAuction = auctionRepository.save(auction);

        return toResponse(savedAuction);
    }

    @Transactional(readOnly = true)
    public List<AuctionResponse> getAuctionsByCreator(String creatorEmail) {

        User creator = userRepository.findByEmailIgnoreCase(creatorEmail)
                .filter(User::isActive)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Creator account not found"
                ));

        return auctionRepository.findByCreatorId(creator.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuctionResponse getAuctionById(
            Long auctionId,
            String creatorEmail) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Auction not found"
                ));

        if (!auction.getCreator().getEmail()
                .equalsIgnoreCase(creatorEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to access this auction"
            );
        }

        return toResponse(auction);
    }

    private void validateAuction(CreateAuctionRequest request) {

        if (request.auctionName() == null
                || request.auctionName().isBlank()) {
            throw new IllegalArgumentException(
                    "Auction name is required");
        }

        if (request.category() == null
                || request.category().isBlank()) {
            throw new IllegalArgumentException(
                    "Auction category is required");
        }

        if (request.visibility() == null
                || request.visibility().isBlank()) {
            throw new IllegalArgumentException(
                    "Auction visibility is required");
        }

        LocalDateTime start = request.startDate();
        LocalDateTime deadline = request.registrationDeadline();
        LocalDateTime end = request.endDate();

        if (start == null || deadline == null) {
            throw new IllegalArgumentException(
                    "Start date and registration deadline are required");
        }

        if (!deadline.isBefore(start)) {
            throw new IllegalArgumentException(
                    "Registration deadline must be before auction start");
        }

        if (end != null && !end.isAfter(start)) {
            throw new IllegalArgumentException(
                    "End date must be after auction start");
        }

        Integer teams = request.numberOfTeams();
        Integer minPlayers = request.minPlayers();
        Integer maxPlayers = request.maxPlayers();
        Integer totalPlayers = request.maxAuctionPlayers();

        if (teams == null || teams < 2) {
            throw new IllegalArgumentException(
                    "At least 2 teams are required");
        }

        if (minPlayers == null || minPlayers < 1
                || maxPlayers == null || maxPlayers < minPlayers) {
            throw new IllegalArgumentException(
                    "Player limits are invalid");
        }

        if (totalPlayers == null
                || totalPlayers < teams
                || (long) totalPlayers < (long) teams * minPlayers) {
            throw new IllegalArgumentException(
                    "Total player capacity is too low for the configured teams");
        }

        if (request.teamBudget() == null
                || request.teamBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Team budget must be greater than zero");
        }

        if (request.bidIncrement() == null
                || request.bidIncrement().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Bid increment must be greater than zero");
        }

        if (request.bidTimer() == null
                || request.bidTimer() < 5
                || request.bidTimer() > 300) {
            throw new IllegalArgumentException(
                    "Bid timer must be between 5 and 300 seconds");
        }

        validateLength(request.timeZone(), 60, "Time zone");
        validateLength(request.playerApproval(), 30, "Player approval");
        validateLength(
                request.registrationApproval(), 30, "Registration approval");
        validateLength(request.bidCancellation(), 50, "Bid cancellation");

        if (request.playerApproval() != null
                && request.playerApproval().isBlank()) {
            throw new IllegalArgumentException(
                    "Player approval setting cannot be blank");
        }

        if (request.registrationApproval() != null
                && request.registrationApproval().isBlank()) {
            throw new IllegalArgumentException(
                    "Registration approval setting cannot be blank");
        }

        if (request.bidCancellation() != null
                && request.bidCancellation().isBlank()) {
            throw new IllegalArgumentException(
                    "Bid cancellation setting cannot be blank");
        }

        if (request.description() != null
                && request.description().length() > 2000) {
            throw new IllegalArgumentException(
                    "Description is too long");
        }

        if (request.customRules() != null
                && request.customRules().length() > 3000) {
            throw new IllegalArgumentException(
                    "Custom rules are too long");
        }
    }

    private void validateLength(
            String value,
            int maxLength,
            String fieldName) {

        if (value != null && value.length() > maxLength) {
            throw new IllegalArgumentException(
                    fieldName + " exceeds the maximum length of " + maxLength);
        }
    }

    private String defaultTimeZone(String timeZone) {
        return timeZone == null || timeZone.isBlank()
                ? "Asia/Kolkata"
                : timeZone.trim();
    }

    private String defaultText(String value, String defaultValue) {
        return value == null || value.isBlank()
                ? defaultValue
                : value.trim();
    }

    private AuctionResponse toResponse(Auction auction) {
        return new AuctionResponse(
                auction.getId(),
                auction.getAuctionName(),
                auction.getCategory(),
                auction.getVisibility(),
                auction.getDescription(),
                auction.getStartDate(),
                auction.getRegistrationDeadline(),
                auction.getEndDate(),
                auction.getTimeZone(),
                auction.getNumberOfTeams(),
                auction.getTeamBudget(),
                auction.getMinPlayers(),
                auction.getMaxPlayers(),
                auction.getMaxAuctionPlayers(),
                auction.getBidIncrement(),
                auction.getBidTimer(),
                auction.getStatus(),
                auction.getCreator().getEmail()
        );
    }
}

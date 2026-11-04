
package com.pitchbid.liveauction.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitchbid.auction.Auction;
import com.pitchbid.auction.AuctionRepository;
import com.pitchbid.liveauction.AuctionResult;
import com.pitchbid.liveauction.AuctionResultRepository;
import com.pitchbid.player.Player;
import com.pitchbid.player.PlayerRepository;
import com.pitchbid.team.Team;
import com.pitchbid.team.TeamRepository;

@Service
public class AuctionResultExcelService {

    private final AuctionRepository auctionRepository;
    private final AuctionResultRepository resultRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    public AuctionResultExcelService(
            AuctionRepository auctionRepository,
            AuctionResultRepository resultRepository,
            PlayerRepository playerRepository,
            TeamRepository teamRepository) {

        this.auctionRepository = auctionRepository;
        this.resultRepository = resultRepository;
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateExcel(Long auctionId) {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Auction not found"));

        List<AuctionResult> results =
                resultRepository.findByAuctionIdOrderByFinalizedAtDesc(
                        auctionId
                );

        List<Player> players =
                playerRepository.findByAuctionId(auctionId);

        List<Team> teams =
                teamRepository.findByAuctionId(auctionId);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            createAuctionOverview(
                    workbook, auction, results, players, teams
            );

            createPlayerResults(workbook, results);

            createTeamSummary(workbook, teams, results);

            workbook.write(output);

            return output.toByteArray();

        } catch (IOException exception) {
            throw new RuntimeException(
                    "Unable to generate auction Excel report",
                    exception
            );
        }
    }

    // =========================================================
    // 1. AUCTION OVERVIEW
    // =========================================================

    private void createAuctionOverview(
            Workbook workbook,
            Auction auction,
            List<AuctionResult> results,
            List<Player> players,
            List<Team> teams) {

        Sheet sheet = workbook.createSheet("Auction Overview");

        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle labelStyle = createLabelStyle(workbook);

        Row titleRow = sheet.createRow(0);
        titleRow.setHeightInPoints(30);

        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("PITCHBID - AUCTION REPORT");
        titleCell.setCellStyle(titleStyle);

        sheet.addMergedRegion(
                new org.apache.poi.ss.util.CellRangeAddress(
                        0, 0, 0, 1
                )
        );

        int soldCount = countResults(results, "SOLD");
        int unsoldCount = countResults(results, "UNSOLD");

        long pendingPlayers = players.stream()
                .filter(p -> "PENDING".equalsIgnoreCase(p.getStatus()))
                .count();

        long approvedPlayers = players.stream()
                .filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()))
                .count();

        long rejectedPlayers = players.stream()
                .filter(p -> "REJECTED".equalsIgnoreCase(p.getStatus()))
                .count();

        long pendingTeams = teams.stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()))
                .count();

        long approvedTeams = teams.stream()
                .filter(t -> "APPROVED".equalsIgnoreCase(t.getStatus()))
                .count();

        long rejectedTeams = teams.stream()
                .filter(t -> "REJECTED".equalsIgnoreCase(t.getStatus()))
                .count();

        BigDecimal totalSpent = calculateTotalSpent(results);

        BigDecimal totalAllocatedBudget =
                auction.getTeamBudget()
                        .multiply(BigDecimal.valueOf(
                                auction.getNumberOfTeams()
                        ));

        String[][] data = {
                {"AUCTION INFORMATION", ""},
                {"Auction ID", String.valueOf(auction.getId())},
                {"Auction Name", auction.getAuctionName()},
                {"Category", auction.getCategory()},
                {"Visibility", auction.getVisibility()},
                {"Description", auction.getDescription()},
                {"Auction Status", auction.getStatus()},
                {"Start Date", stringValue(auction.getStartDate())},
                {"Registration Deadline",
                        stringValue(auction.getRegistrationDeadline())},
                {"End Date", stringValue(auction.getEndDate())},
                {"Time Zone", auction.getTimeZone()},
                {"Custom Rules", auction.getCustomRules()},

                {"AUCTION CONFIGURATION", ""},
                {"Configured Number of Teams",
                        String.valueOf(auction.getNumberOfTeams())},
                {"Registered Teams", String.valueOf(teams.size())},
                {"Team Budget", money(auction.getTeamBudget())},
                {"Total Allocated Team Budget",
                        money(totalAllocatedBudget)},
                {"Minimum Players per Team",
                        String.valueOf(auction.getMinPlayers())},
                {"Maximum Players per Team",
                        String.valueOf(auction.getMaxPlayers())},
                {"Maximum Auction Players",
                        String.valueOf(auction.getMaxAuctionPlayers())},
                {"Bid Increment", money(auction.getBidIncrement())},
                {"Bid Timer (Seconds)",
                        String.valueOf(auction.getBidTimer())},

                {"TEAM REGISTRATION STATISTICS", ""},
                {"Pending Teams", String.valueOf(pendingTeams)},
                {"Approved Teams", String.valueOf(approvedTeams)},
                {"Rejected Teams", String.valueOf(rejectedTeams)},

                {"PLAYER REGISTRATION STATISTICS", ""},
                {"Total Registered Players", String.valueOf(players.size())},
                {"Pending Players", String.valueOf(pendingPlayers)},
                {"Approved Players", String.valueOf(approvedPlayers)},
                {"Rejected Players", String.valueOf(rejectedPlayers)},

                {"FINAL AUCTION RESULTS", ""},
                {"Total Finalized Players",
                        String.valueOf(results.size())},
                {"Players Sold", String.valueOf(soldCount)},
                {"Players Unsold", String.valueOf(unsoldCount)},
                {"Total Auction Expenditure", money(totalSpent)}
        };

        int rowIndex = 2;

        for (String[] item : data) {

            Row row = sheet.createRow(rowIndex++);

            Cell label = row.createCell(0);
            label.setCellValue(item[0]);

            Cell value = row.createCell(1);
            value.setCellValue(item[1] == null ? "" : item[1]);

            if (item[1].isEmpty()) {
                label.setCellStyle(headerStyle);
                value.setCellStyle(headerStyle);
            } else {
                label.setCellStyle(labelStyle);
            }
        }

        sheet.setColumnWidth(0, 9000);
        sheet.setColumnWidth(1, 15000);
        sheet.createFreezePane(0, 2);
    }

    // =========================================================
    // 2. COMPLETE PLAYER RESULTS
    // =========================================================

    private void createPlayerResults(
            Workbook workbook,
            List<AuctionResult> results) {

        Sheet sheet = workbook.createSheet("Player Results");

        String[] headers = {
                "Player ID",
                "Player Number",
                "Full Name",
                "Email",
                "Phone",
                "Date of Birth",
                "Gender",
                "City",
                "Player Role",
                "Batting Style",
                "Bowling Style",
                "Wicketkeeper",
                "Registration Type",
                "Registration Status",
                "Registered At",
                "Base Price",
                "Auction Result",
                "Purchasing Team ID",
                "Purchasing Team",
                "Team Short Name",
                "Final Sold Price",
                "Finalized At"
        };

        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle soldStyle = createSoldStyle(workbook);
        CellStyle unsoldStyle = createUnsoldStyle(workbook);

        createHeaderRow(sheet, headers, headerStyle);

        int rowIndex = 1;

        for (AuctionResult result : results) {

            Player player = result.getPlayer();
            Team team = result.getTeam();

            Row row = sheet.createRow(rowIndex++);

            int col = 0;

            setCell(row, col++, player.getId());
            setCell(row, col++, player.getPlayerNumber());
            setCell(row, col++, player.getFullName());
            setCell(row, col++, player.getEmail());
            setCell(row, col++, player.getPhone());
            setCell(row, col++, player.getDateOfBirth());
            setCell(row, col++, player.getGender());
            setCell(row, col++, player.getCity());
            setCell(row, col++, player.getPlayerRole());
            setCell(row, col++, player.getBattingStyle());
            setCell(row, col++, player.getBowlingStyle());
            setCell(row, col++, player.isWicketkeeper() ? "YES" : "NO");
            setCell(row, col++, player.getRegistrationType());
            setCell(row, col++, player.getStatus());
            setCell(row, col++, player.getRegisteredAt());
            setCell(row, col++, player.getBasePrice());

            setCell(row, col++, result.getResultStatus());

            setCell(row, col++, team != null ? team.getId() : null);
            setCell(row, col++, team != null ? team.getTeamName() : null);
            setCell(row, col++, team != null ? team.getTeamShortName() : null);

            setCell(row, col++, result.getFinalPrice());
            setCell(row, col, result.getFinalizedAt());

            Cell statusCell = row.getCell(16);

            if ("SOLD".equalsIgnoreCase(result.getResultStatus())) {
                statusCell.setCellStyle(soldStyle);
            } else {
                statusCell.setCellStyle(unsoldStyle);
            }
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(
                new org.apache.poi.ss.util.CellRangeAddress(
                        0,
                        Math.max(0, rowIndex - 1),
                        0,
                        headers.length - 1
                )
        );

        autoSizeColumns(sheet, headers.length);
    }

    // =========================================================
    // 3. TEAM-WISE SUMMARY
    // =========================================================

    private void createTeamSummary(
            Workbook workbook,
            List<Team> teams,
            List<AuctionResult> results) {

        Sheet sheet = workbook.createSheet("Team Summary");

        String[] headers = {
                "Team ID",
                "Team Name",
                "Team Short Name",
                "Owner Name",
                "Owner Email",
                "Owner Phone",
                "Team City",
                "Team Description",
                "Team Logo Path",
                "Team Status",
                "Registered At",
                "Initial Team Budget",
                "Players Purchased",
                "Purchased Player Names",
                "Total Amount Spent",
                "Remaining Budget",
                "Average Purchase Price"
        };

        CellStyle headerStyle = createHeaderStyle(workbook);

        createHeaderRow(sheet, headers, headerStyle);

        Map<Long, List<AuctionResult>> teamResults = new HashMap<>();

        for (AuctionResult result : results) {

            if (result.getTeam() != null
                    && "SOLD".equalsIgnoreCase(result.getResultStatus())) {

                teamResults.computeIfAbsent(
                        result.getTeam().getId(),
                        id -> new java.util.ArrayList<>()
                ).add(result);
            }
        }

        int rowIndex = 1;

        for (Team team : teams) {

            List<AuctionResult> purchases =
                    teamResults.getOrDefault(
                            team.getId(),
                            List.of()
                    );

            BigDecimal totalSpent = calculateTotalSpent(purchases);

            int purchasedCount = purchases.size();

            BigDecimal averagePrice = purchasedCount > 0
                    ? totalSpent.divide(
                            BigDecimal.valueOf(purchasedCount),
                            2,
                            RoundingMode.HALF_UP
                    )
                    : BigDecimal.ZERO;

            String purchasedPlayerNames = purchases.stream()
                    .map(r -> r.getPlayer().getFullName())
                    .collect(
                            java.util.stream.Collectors.joining(", ")
                    );

            Row row = sheet.createRow(rowIndex++);

            int col = 0;

            setCell(row, col++, team.getId());
            setCell(row, col++, team.getTeamName());
            setCell(row, col++, team.getTeamShortName());
            setCell(row, col++, team.getOwnerName());
            setCell(row, col++, team.getOwnerEmail());
            setCell(row, col++, team.getOwnerPhone());
            setCell(row, col++, team.getTeamCity());
            setCell(row, col++, team.getTeamDescription());
            setCell(row, col++, team.getTeamLogoPath());
            setCell(row, col++, team.getStatus());
            setCell(row, col++, team.getRegisteredAt());
            setCell(row, col++, team.getAuction().getTeamBudget());
            setCell(row, col++, purchasedCount);
            setCell(row, col++, purchasedPlayerNames);
            setCell(row, col++, totalSpent);
            setCell(row, col++, team.getRemainingBudget());
            setCell(row, col, averagePrice);
        }

        sheet.createFreezePane(0, 1);

        sheet.setAutoFilter(
                new org.apache.poi.ss.util.CellRangeAddress(
                        0,
                        Math.max(0, rowIndex - 1),
                        0,
                        headers.length - 1
                )
        );

        autoSizeColumns(sheet, headers.length);
    }

    // =========================================================
    // COMMON HELPERS
    // =========================================================

    private int countResults(
            List<AuctionResult> results,
            String status) {

        return (int) results.stream()
                .filter(r -> status.equalsIgnoreCase(r.getResultStatus()))
                .count();
    }

    private BigDecimal calculateTotalSpent(
            List<AuctionResult> results) {

        return results.stream()
                .filter(r -> "SOLD".equalsIgnoreCase(r.getResultStatus()))
                .map(AuctionResult::getFinalPrice)
                .filter(price -> price != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String money(BigDecimal amount) {
        return amount == null ? "0.00" : amount.toPlainString();
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    private void setCell(Row row, int column, Object value) {

        Cell cell = row.createCell(column);

        if (value == null) {
            cell.setCellValue("");
        } else if (value instanceof BigDecimal decimal) {
            cell.setCellValue(decimal.doubleValue());
        } else if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else if (value instanceof Boolean bool) {
            cell.setCellValue(bool);
        } else {
            cell.setCellValue(value.toString());
        }
    }

    private void createHeaderRow(
            Sheet sheet,
            String[] headers,
            CellStyle style) {

        Row row = sheet.createRow(0);
        row.setHeightInPoints(28);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void autoSizeColumns(Sheet sheet, int count) {

        for (int i = 0; i < count; i++) {
            sheet.autoSizeColumn(i);

            if (sheet.getColumnWidth(i) > 15000) {
                sheet.setColumnWidth(i, 15000);
            }
        }
    }

    // =========================================================
    // EXCEL STYLES
    // =========================================================

    private CellStyle createTitleStyle(Workbook workbook) {

        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 18);
        font.setColor(IndexedColors.WHITE.getIndex());

        style.setFont(font);
        style.setFillForegroundColor(
                IndexedColors.DARK_BLUE.getIndex()
        );
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {

        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());

        style.setFont(font);
        style.setFillForegroundColor(
                IndexedColors.DARK_BLUE.getIndex()
        );
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);

        return style;
    }

    private CellStyle createLabelStyle(Workbook workbook) {

        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);

        style.setFont(font);
        style.setFillForegroundColor(
                IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex()
        );
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        return style;
    }

    private CellStyle createSoldStyle(Workbook workbook) {

        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.GREEN.getIndex());

        style.setFont(font);

        return style;
    }

    private CellStyle createUnsoldStyle(Workbook workbook) {

        CellStyle style = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.RED.getIndex());

        style.setFont(font);

        return style;
    }
}


package com.pitchbid.liveauction;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pitchbid.liveauction.dto.AuctionResultResponse;
import com.pitchbid.liveauction.export.AuctionResultExcelService;
import com.pitchbid.liveauction.export.AuctionResultPdfService;

@RestController
@RequestMapping("/api/auctions/{auctionId}/results")
public class AuctionResultController {

    private final AuctionResultService resultService;
    private final AuctionResultPdfService pdfService;
    private final AuctionResultExcelService excelService;

    public AuctionResultController(
            AuctionResultService resultService,
            AuctionResultPdfService pdfService,
            AuctionResultExcelService excelService) {

        this.resultService = resultService;
        this.pdfService = pdfService;
        this.excelService = excelService;
    }

    // Get all results or filter by SOLD / UNSOLD.
    @GetMapping
    public ResponseEntity<List<AuctionResultResponse>> getResults(
            @PathVariable Long auctionId,
            @RequestParam(required = false) String status,
            Principal principal) {

        List<AuctionResultResponse> results =
                resultService.getResults(
                        auctionId,
                        principal.getName(),
                        status
                );

        return ResponseEntity.ok(results);
    }

    // Export finalized auction results as PDF.
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportResultsPdf(
            @PathVariable Long auctionId,
            Principal principal) {

        // Validate auction ownership before generating the report.
        resultService.getResults(
                auctionId,
                principal.getName(),
                null
        );

        byte[] pdf = pdfService.generatePdf(auctionId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=pitchbid-auction-"
                                + auctionId + "-results.pdf"
                )
                .body(pdf);
    }

    // Export finalized auction results as Excel.
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportResultsExcel(
            @PathVariable Long auctionId,
            Principal principal) {

        // Validate auction ownership before generating the report.
        resultService.getResults(
                auctionId,
                principal.getName(),
                null
        );

        byte[] excel = excelService.generateExcel(auctionId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=pitchbid-auction-"
                                + auctionId + "-results.xlsx"
                )
                .body(excel);
    }
}

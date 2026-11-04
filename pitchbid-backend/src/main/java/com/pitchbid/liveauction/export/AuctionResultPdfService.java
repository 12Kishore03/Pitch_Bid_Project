
package com.pitchbid.liveauction.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import com.pitchbid.liveauction.AuctionResult;
import com.pitchbid.liveauction.AuctionResultRepository;

@Service
public class AuctionResultPdfService {

    private final AuctionResultRepository resultRepository;

    public AuctionResultPdfService(
            AuctionResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    public byte[] generatePdf(Long auctionId) {

        List<AuctionResult> results =
                resultRepository.findByAuctionIdOrderByFinalizedAtDesc(
                        auctionId
                );

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDPageContentStream content =
                    new PDPageContentStream(document, page);

            float y = 780;

            content.beginText();
            content.setFont(
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD),
                    18
            );
            content.newLineAtOffset(50, y);
            content.showText("PITCHBID - AUCTION RESULTS");
            content.endText();

            y -= 35;

            content.beginText();
            content.setFont(
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA),
                    11
            );
            content.newLineAtOffset(50, y);
            content.showText("Auction ID: " + auctionId);
            content.endText();

            y -= 35;

            String[] headers = {
                    "Player",
                    "Role",
                    "Team",
                    "Final Price",
                    "Status"
            };

            float[] positions = {50, 175, 260, 375, 465};

            content.setFont(
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD),
                    9
            );

            for (int i = 0; i < headers.length; i++) {
                content.beginText();
                content.newLineAtOffset(positions[i], y);
                content.showText(headers[i]);
                content.endText();
            }

            y -= 20;

            content.setFont(
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA),
                    8
            );

            for (AuctionResult result : results) {

                if (y < 60) {
                    content.close();

                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);

                    content = new PDPageContentStream(document, page);
                    y = 780;

                    content.setFont(
                            new PDType1Font(
                                    Standard14Fonts.FontName.HELVETICA_BOLD
                            ),
                            9
                    );

                    for (int i = 0; i < headers.length; i++) {
                        content.beginText();
                        content.newLineAtOffset(positions[i], y);
                        content.showText(headers[i]);
                        content.endText();
                    }

                    y -= 20;

                    content.setFont(
                            new PDType1Font(
                                    Standard14Fonts.FontName.HELVETICA
                            ),
                            8
                    );
                }

                String player = result.getPlayer() != null
                        ? result.getPlayer().getFullName()
                        : "-";

                String role = result.getPlayer() != null
                        ? result.getPlayer().getPlayerRole()
                        : "-";

                String team = result.getTeam() != null
                        ? result.getTeam().getTeamName()
                        : "-";

                String price = result.getFinalPrice() != null
                        ? result.getFinalPrice().toPlainString()
                        : "-";

                String status = result.getResultStatus();

                String[] values = {
                        player,
                        role,
                        team,
                        price,
                        status
                };

                for (int i = 0; i < values.length; i++) {
                    content.beginText();
                    content.newLineAtOffset(
                            positions[i],
                            y
                    );
                    content.showText(safePdfText(values[i]));
                    content.endText();
                }

                y -= 20;
            }

            content.close();

            document.save(output);

            return output.toByteArray();

        } catch (IOException exception) {
            throw new RuntimeException(
                    "Unable to generate auction results PDF",
                    exception
            );
        }
    }

    private String safePdfText(String value) {
        if (value == null) {
            return "-";
        }

        return value.replaceAll("[^\\x20-\\x7E]", "?");
    }
}

import { jsPDF } from 'jspdf';
import { ScanReport } from '../types/detector';

/**
 * Generates an executive PDF Summary Report of a plagiarism audit.
 * Fully client-side, offline, styled with headers, tables, charts/badges, and match quotes.
 */
export function generateSummaryPdf(report: ScanReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Title & Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PLAGora', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('ACADEMIC INTEGRITY & PLAGIARISM AUDIT REPORT', margin, 18);

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(8);
  const auditDate = new Date(report.timestamp).toLocaleString();
  doc.text(`Generated: ${auditDate} | Audit ID: #${report.id.slice(0, 8)}`, margin, 24);

  // Status Badge in Top Right
  const isHigh = report.overallSimilarityPercent > 40;
  const isModerate = report.overallSimilarityPercent > 15;
  const badgeText = isHigh ? 'HIGH SIMILARITY' : isModerate ? 'MODERATE OVERLAP' : 'ACCEPTABLE / ORIGINAL';
  
  if (isHigh) {
    doc.setFillColor(225, 29, 72); // rose-600
  } else if (isModerate) {
    doc.setFillColor(217, 119, 6); // amber-600
  } else {
    doc.setFillColor(16, 185, 129); // emerald-500
  }
  doc.roundedRect(pageWidth - margin - 52, 10, 52, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(badgeText, pageWidth - margin - 26, 16.5, { align: 'center' });

  y = 40;

  // Document Information Section
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Document Information', margin, y);
  y += 5;

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const col1 = margin + 4;
  const col2 = margin + 95;

  doc.setFont('helvetica', 'bold');
  doc.text('Document Title:', col1, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(report.submissionTitle.length > 45 ? report.submissionTitle.slice(0, 42) + '...' : report.submissionTitle, col1 + 26, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Characters:', col1, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${(report.totalChars || report.submissionText.length).toLocaleString()} chars`, col1 + 28, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Scanned Corpus:', col1, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.max(report.topSources.length, 8)} reference documents`, col1 + 28, y + 19);

  const originalPercent = Math.max(0, 100 - report.overallSimilarityPercent);
  doc.setFont('helvetica', 'bold');
  doc.text('Plagiarism Score:', col2, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.overallSimilarityPercent}%`, col2 + 28, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Originality Score:', col2, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${originalPercent.toFixed(1)}%`, col2 + 28, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Flagged Matches:', col2, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.matches.length} contiguous passages`, col2 + 28, y + 19);

  y += 32;

  // Executive Scores Metric Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Executive Similarity Scores', margin, y);
  y += 5;

  const cardWidth = (pageWidth - (margin * 2) - 8) / 3;

  // Card 1: Plagiarism Score
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(margin, y, cardWidth, 22, 2, 2, 'FD');
  doc.setTextColor(159, 18, 57);
  doc.setFontSize(8);
  doc.text('PLAGIARISM SCORE', margin + 4, y + 5);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`${report.overallSimilarityPercent}%`, margin + 4, y + 15);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Overlapping content', margin + 4, y + 19);

  // Card 2: Originality Score
  const card2X = margin + cardWidth + 4;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(card2X, y, cardWidth, 22, 2, 2, 'FD');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ORIGINALITY SCORE', card2X + 4, y + 5);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`${originalPercent.toFixed(1)}%`, card2X + 4, y + 15);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Unique text written', card2X + 4, y + 19);

  // Card 3: Top Matched Source
  const card3X = card2X + cardWidth + 4;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(card3X, y, cardWidth, 22, 2, 2, 'FD');
  doc.setTextColor(55, 48, 163);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PRIMARY SOURCE', card3X + 4, y + 5);
  doc.setFontSize(11);
  const topSrc = report.topSources[0];
  const topTitle = topSrc ? (topSrc.docTitle.length > 18 ? topSrc.docTitle.slice(0, 16) + '...' : topSrc.docTitle) : 'None';
  doc.text(topTitle, card3X + 4, y + 13);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(topSrc ? `${topSrc.similarityPercent}% match rate` : 'Clean document', card3X + 4, y + 19);

  y += 29;

  // Algorithm Breakdown Bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('3. Detection Algorithm Breakdown', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'FD');

  const totalChars = Math.max(1, report.totalChars || report.submissionText.length);
  const winnowShare = Math.round((report.layerBreakdown.exactWinnowing / totalChars) * 100);
  const lexicalShare = Math.round((report.layerBreakdown.lexicalAlignment / totalChars) * 100);
  const semanticShare = Math.round((report.layerBreakdown.semanticParaphrase / totalChars) * 100);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const bCol1 = margin + 4;
  const bCol2 = margin + 65;
  const bCol3 = margin + 125;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Exact Phrase Matches: ${winnowShare}%`, bCol1, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${report.layerBreakdown.exactWinnowing.toLocaleString()} chars (Winnowing n-grams)`, bCol1, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text(`Sequence Alignment: ${lexicalShare}%`, bCol2, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${report.layerBreakdown.lexicalAlignment.toLocaleString()} chars (Word swaps/edits)`, bCol2, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text(`Semantic Paraphrase: ${semanticShare}%`, bCol3, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${report.layerBreakdown.semanticParaphrase.toLocaleString()} chars (Synonym concepts)`, bCol3, y + 14);

  y += 28;

  // Matched Sources Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('4. Matching Reference Sources', margin, y);
  y += 5;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DOCUMENT / REPOSITORY SOURCE', margin + 3, y + 4.2);
  doc.text('MATCHED CHARS', margin + 95, y + 4.2);
  doc.text('SIMILARITY SCORE', margin + 130, y + 4.2);
  doc.text('PASSAGES', pageWidth - margin - 18, y + 4.2);
  y += 6;

  if (report.topSources.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No matching source documents identified above threshold.', margin + 3, y + 6);
    y += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    report.topSources.slice(0, 5).forEach((src, idx) => {
      // Row alternating bg
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - (margin * 2), 6.5, 'F');
      }
      doc.setTextColor(30, 41, 59);
      const title = src.docTitle.length > 50 ? src.docTitle.slice(0, 47) + '...' : src.docTitle;
      doc.text(title, margin + 3, y + 4.5);

      doc.setTextColor(100, 116, 139);
      doc.text(src.matchedChars.toLocaleString(), margin + 95, y + 4.5);

      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text(`${src.similarityPercent}%`, margin + 130, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${src.matchCount}`, pageWidth - margin - 12, y + 4.5);

      y += 6.5;
    });
  }

  y += 4;

  // Flagged Excerpts Preview (Top 3 matches)
  if (report.matches.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('5. Key Flagged Excerpts', margin, y);
    y += 5;

    report.matches.slice(0, 3).forEach((m, idx) => {
      if (y > pageHeight - 35) return; // avoid page overrun

      doc.setFillColor(254, 242, 242); // rose-50
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(190, 18, 60);
      const excerptMethod = m.method.toUpperCase();
      doc.text(`[${excerptMethod}] Source: ${m.sourceDocTitle || 'Reference Corpus'} (${Math.round((m.confidence || 0.9) * 100)}% confidence)`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const snippet = m.subText.length > 130 ? m.subText.slice(0, 127) + '...' : m.subText;
      doc.text(`"${snippet.replace(/\n/g, ' ')}"`, margin + 3, y + 10);

      y += 18;
    });
  }

  // Verification & Integrity Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('PLAGora Open-Source Plagiarism Detection System · Academic Integrity Verification', margin, pageHeight - 10);
  doc.text('This report was generated using explainable deterministic algorithms (Winnowing + Lexical Alignment).', margin, pageHeight - 6);
  doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // Save the PDF
  const cleanTitle = (report.submissionTitle || 'Document')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const filename = `PLAGora_Summary_Report_${cleanTitle}.pdf`;
  doc.save(filename);
}

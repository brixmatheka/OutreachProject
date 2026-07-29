import axios from "./apiConfig";

const ORGANIZATION = {
  name: "Outreach Hope Church Sunshine",
  subtitle: "House of Bread",
  phone: "+254 722 539 649",
  email: "outreachhopechurch.sunshine@gmail.com",
  website: "outreachhopechurch.org",
};

export const escapeReportHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const safeFilePart = (value) => String(value || "report")
  .replace(/[^a-z0-9_-]+/gi, "_")
  .replace(/^_+|_+$/g, "")
  .slice(0, 80);

const downloadBlob = (content, type, filename) => {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const reportFileDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const recordExport = (reportId, title, format, recordCount, filters) => {
  axios.post("/api/admin/report-audit", {
    reportId,
    title,
    format,
    recordCount,
    filters,
  }).catch(() => {
    // Report download remains available during a temporary audit-service outage.
  });
};

const csvCell = (value) => {
  let text = value == null ? "" : String(value);
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  if (/^(?:0|\+)\d{6,}$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const formatReportDate = (value, includeTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-KE", includeTime
    ? { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }
    : { dateStyle: "medium", timeZone: "Africa/Nairobi" });
};

export const maskSensitiveId = (value) => {
  const text = String(value || "").trim();
  if (!text) return "—";
  return `••••${text.slice(-4)}`;
};

export const formatKes = (value) => new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
}).format(Number(value) || 0);

export function downloadCsvReport({ title, headers, rows, filters = {}, summary = {} }) {
  const reportId = `OHC-${Date.now().toString(36).toUpperCase()}`;
  const metadataRows = [
    [ORGANIZATION.name],
    [title],
    ["Report ID", reportId],
    ["Generated", formatReportDate(new Date(), true)],
    ...Object.entries(filters).map(([label, value]) => [`Filter: ${label}`, value]),
    [],
  ];
  const summaryRows = Object.keys(summary).length
    ? [[], ["SUMMARY"], ...Object.entries(summary).map(([label, value]) => [label, value])]
    : [];
  const content = [...metadataRows, headers, ...rows, ...summaryRows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const date = reportFileDate();
  recordExport(reportId, title, "csv", rows.length, filters);
  downloadBlob(content, "text/csv;charset=utf-8", `${safeFilePart(title)}_${date}.csv`);
}

export function downloadWordReport({
  title,
  subtitle = "",
  columns,
  rows,
  filters = {},
  summary = {},
  preparedBy = localStorage.getItem("adminName") || "Authorized Administrator",
}) {
  const reportId = `OHC-${Date.now().toString(36).toUpperCase()}`;
  const filterEntries = Object.entries(filters).filter(([, value]) => value !== "" && value != null);
  const summaryEntries = Object.entries(summary);
  const html = `<!doctype html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="utf-8">
        <title>${escapeReportHtml(title)}</title>
        <style>
          @page { size: A4 landscape; margin: 16mm; }
          body { color:#172033; font-family:Arial,sans-serif; font-size:9.5pt; margin:0; }
          .letterhead { border-bottom:3px solid #0284c7; padding-bottom:12px; margin-bottom:18px; }
          .brand { color:#075985; font-size:20pt; font-weight:800; margin:0; }
          .tagline { color:#64748b; font-size:9pt; margin:3px 0 0; }
          h1 { color:#172033; font-size:16pt; margin:0 0 4px; }
          .subtitle { color:#64748b; margin:0 0 14px; }
          .meta { width:100%; border-collapse:collapse; margin-bottom:15px; }
          .meta td { background:#f1f5f9; border:1px solid #dbe4ee; padding:7px; font-size:8.5pt; }
          .summary { display:table; width:100%; margin:0 0 15px; border-spacing:6px; }
          .summary-item { display:table-cell; background:#e0f2fe; border:1px solid #bae6fd; padding:9px; }
          .summary-item b { display:block; color:#075985; font-size:12pt; margin-top:3px; }
          table.data { border-collapse:collapse; width:100%; table-layout:auto; }
          table.data th { background:#075985; color:#fff; padding:8px 6px; border:1px solid #0c4a6e; text-align:left; font-size:8.5pt; }
          table.data td { border:1px solid #cbd5e1; padding:7px 6px; vertical-align:top; overflow-wrap:anywhere; }
          table.data tr:nth-child(even) td { background:#f8fafc; }
          .footer { border-top:1px solid #cbd5e1; color:#64748b; margin-top:18px; padding-top:9px; font-size:8pt; }
          .signature { margin-top:30px; width:240px; border-top:1px solid #334155; padding-top:5px; }
        </style>
      </head>
      <body>
        <header class="letterhead">
          <p class="brand">${ORGANIZATION.name}</p>
          <p class="tagline">${ORGANIZATION.subtitle} · ${ORGANIZATION.phone} · ${ORGANIZATION.email} · ${ORGANIZATION.website}</p>
        </header>
        <h1>${escapeReportHtml(title)}</h1>
        ${subtitle ? `<p class="subtitle">${escapeReportHtml(subtitle)}</p>` : ""}
        <table class="meta"><tr>
          <td><b>Report ID</b><br>${reportId}</td>
          <td><b>Generated</b><br>${escapeReportHtml(formatReportDate(new Date(), true))}</td>
          <td><b>Prepared by</b><br>${escapeReportHtml(preparedBy)}</td>
          <td><b>Records</b><br>${rows.length}</td>
        </tr>${filterEntries.length ? `<tr><td colspan="4"><b>Applied filters:</b> ${filterEntries.map(([key, value]) => `${escapeReportHtml(key)}: ${escapeReportHtml(value)}`).join(" · ")}</td></tr>` : ""}</table>
        ${summaryEntries.length ? `<div class="summary">${summaryEntries.map(([label, value]) => `<div class="summary-item">${escapeReportHtml(label)}<b>${escapeReportHtml(value)}</b></div>`).join("")}</div>` : ""}
        <table class="data">
          <thead><tr>${columns.map((column) => `<th>${escapeReportHtml(column.label)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeReportHtml(typeof column.value === "function" ? column.value(row) : row[column.value])}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
        <div class="signature">Authorized signature / approval</div>
        <footer class="footer">Confidential organizational record · ${ORGANIZATION.name} · ${reportId}</footer>
      </body>
    </html>`;
  const date = reportFileDate();
  recordExport(reportId, title, "word", rows.length, filters);
  downloadBlob(html, "application/msword", `${safeFilePart(title)}_${date}.doc`);
}

export async function downloadPdfReport({
  title,
  subtitle = "",
  columns,
  rows,
  filters = {},
  summary = {},
  preparedBy = localStorage.getItem("adminName") || "Authorized Administrator",
}) {
  const { jsPDF } = await import("jspdf");
  const landscape = columns.length > 5;
  const doc = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  const reportId = `OHC-${Date.now().toString(36).toUpperCase()}`;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const usableWidth = pageWidth - (margin * 2);
  const weights = columns.map((column) => Number(column.width) > 0 ? Number(column.width) : 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const columnWidths = weights.map((weight) => usableWidth * (weight / totalWeight));
  const cleanText = (value) => String(value ?? "—").replace(/[•·]/g, "-");
  const cellValue = (row, column) => cleanText(
    typeof column.value === "function" ? column.value(row) : row[column.value]
  );
  const lineHeight = 3.6;

  const drawHeader = (isContinuation = false) => {
    let y = margin;
    doc.setTextColor(7, 89, 133);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isContinuation ? 12 : 17);
    doc.text(ORGANIZATION.name, margin, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(`${ORGANIZATION.subtitle} | ${ORGANIZATION.phone} | ${ORGANIZATION.email}`, margin, y + 9);
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.7);
    doc.line(margin, y + 12, pageWidth - margin, y + 12);
    y += 18;

    doc.setTextColor(23, 32, 51);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isContinuation ? 10 : 14);
    doc.text(isContinuation ? `${title} (continued)` : cleanText(title), margin, y);
    y += isContinuation ? 7 : 6;

    if (!isContinuation) {
      if (subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        const subtitleLines = doc.splitTextToSize(cleanText(subtitle), usableWidth);
        doc.text(subtitleLines, margin, y);
        y += (subtitleLines.length * lineHeight) + 2;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, usableWidth, 12, 2, 2, "F");
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Report ID: ${reportId}`, margin + 3, y + 4.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${formatReportDate(new Date(), true)}`, margin + 3, y + 9);
      doc.text(`Prepared by: ${cleanText(preparedBy)}`, margin + (usableWidth * 0.5), y + 4.5);
      doc.text(`Records: ${rows.length}`, margin + (usableWidth * 0.5), y + 9);
      y += 16;

      const filterText = Object.entries(filters)
        .filter(([, value]) => value !== "" && value != null)
        .map(([label, value]) => `${label}: ${cleanText(value)}`)
        .join(" | ");
      if (filterText) {
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(7.5);
        const filterLines = doc.splitTextToSize(`Applied filters | ${filterText}`, usableWidth);
        doc.text(filterLines, margin, y);
        y += (filterLines.length * lineHeight) + 2;
      }

      const summaryText = Object.entries(summary)
        .map(([label, value]) => `${label}: ${cleanText(value)}`)
        .join(" | ");
      if (summaryText) {
        doc.setTextColor(3, 105, 161);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        const summaryLines = doc.splitTextToSize(`Summary | ${summaryText}`, usableWidth);
        doc.text(summaryLines, margin, y);
        y += (summaryLines.length * lineHeight) + 3;
      }
    }

    return y;
  };

  const drawColumnHeader = (startY) => {
    let x = margin;
    doc.setFillColor(7, 89, 133);
    doc.setDrawColor(12, 74, 110);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    columns.forEach((column, index) => {
      const width = columnWidths[index];
      doc.rect(x, startY, width, 8, "FD");
      const label = doc.splitTextToSize(cleanText(column.label), Math.max(2, width - 3))[0] || "";
      doc.text(label, x + 1.5, startY + 5);
      x += width;
    });
    return startY + 8;
  };

  let y = drawColumnHeader(drawHeader(false));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);

  rows.forEach((row, rowIndex) => {
    const wrappedCells = columns.map((column, index) => (
      doc.splitTextToSize(cellValue(row, column), Math.max(2, columnWidths[index] - 3))
    ));
    const rowHeight = Math.max(7, ...wrappedCells.map((lines) => (lines.length * lineHeight) + 3));

    if (y + rowHeight > pageHeight - 16) {
      doc.addPage();
      y = drawColumnHeader(drawHeader(true));
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
    }

    let x = margin;
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, usableWidth, rowHeight, "F");
    }
    doc.setTextColor(51, 65, 85);
    doc.setDrawColor(203, 213, 225);
    wrappedCells.forEach((lines, index) => {
      const width = columnWidths[index];
      doc.rect(x, y, width, rowHeight);
      doc.text(lines, x + 1.5, y + 4.2);
      x += width;
    });
    y += rowHeight;
  });

  if (rows.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.text("No records matched the selected report criteria.", margin, y + 8);
    y += 10;
  }

  if (y + 22 > pageHeight - 16) {
    doc.addPage();
    y = drawHeader(true);
  }
  doc.setDrawColor(71, 85, 105);
  doc.line(margin, y + 16, margin + 55, y + 16);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Authorized signature / approval", margin, y + 20);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Confidential organizational record | ${reportId}`, margin, pageHeight - 6);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }

  recordExport(reportId, title, "pdf", rows.length, filters);
  doc.save(`${safeFilePart(title)}_${reportFileDate()}.pdf`);
}

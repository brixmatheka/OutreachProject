import { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { downloadCsvReport, downloadPdfReport, downloadWordReport, formatKes, formatReportDate } from "../adminReports";

const styles = {
  page: { fontFamily: "'Poppins', 'Segoe UI', sans-serif", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", minHeight: "100vh", color: "#f8fafc" },
  header: { background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 32px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", position: "sticky", top: 0, zIndex: 100 },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerTitle: { margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#fff" },
  headerSubtitle: { margin: 0, fontSize: "0.72rem", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" },
  backBtn: { background: "rgba(255,255,255,0.05)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 20px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, backdropFilter: "blur(6px)", transition: "all 0.2s" },
  main: { padding: "32px 40px", maxWidth: "1200px", margin: "0 auto" },
  sectionHeading: { fontSize: "1.05rem", fontWeight: 700, color: "#38bdf8", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px", borderLeft: "4px solid #0ea5e9", paddingLeft: "12px" },
  tableContainer: { overflowX: "auto", background: "rgba(30, 41, 59, 0.6)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "18px", padding: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", marginBottom: "32px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" },
  th: { padding: "12px 16px", borderBottom: "2px solid rgba(255,255,255,0.05)", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" },
  td: { padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", color: "#cbd5e1" },
  statusBadge: (status) => ({ padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: status === "Completed" ? "rgba(34, 197, 94, 0.15)" : status === "Pending" ? "rgba(234, 179, 8, 0.15)" : "rgba(239, 68, 68, 0.15)", color: status === "Completed" ? "#4ade80" : status === "Pending" ? "#facc15" : "#f87171" }),
  emptyState: { textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "0.9rem" },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" },
  summaryCard: (accent) => ({ background: "rgba(30, 41, 59, 0.5)", backdropFilter: "blur(12px)", border: `1px solid ${accent}33`, borderRadius: "16px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: `0 4px 20px ${accent}11` }),
  summaryNumber: (accent) => ({ fontSize: "2rem", fontWeight: 800, color: accent, lineHeight: 1 }),
  summaryLabel: { fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px" },
  
  /* ── Tabs ── */
  tabContainer: { display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "20px" },
  tab: (isActive) => ({
    padding: "8px 18px",
    borderRadius: "10px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
    background: isActive ? "#0ea5e9" : "rgba(255,255,255,0.05)",
    color: isActive ? "#fff" : "#94a3b8",
    border: isActive ? "1.5px solid #0ea5e9" : "1.5px solid rgba(255,255,255,0.1)",
    boxShadow: isActive ? "0 4px 12px rgba(14,165,233,0.25)" : "none",
  }),
  
  downloadBtn: {
    background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
    transition: "all 0.2s",
  },
  
  /* ── Print Specific ── */
  printHeader: { display: "none", textAlign: "center", marginBottom: "30px" },
};

/* Inline <style> for print and interactions */
const PrintStyle = () => (
  <style>{`
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background: white !important; margin: 0; padding: 0; }
      main { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
      .table-container { 
        box-shadow: none !important; 
        border: 1px solid #eee !important; 
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        backdrop-filter: none !important;
      }
      th { background-color: #f8fafc !important; color: #000 !important; border-bottom: 1px solid #000 !important; }
      td { border-bottom: 1px solid #eee !important; color: #000 !important; }
      .summary-card { border: 1px solid #eee !important; box-shadow: none !important; background: white !important; }
    }
  `}</style>
);

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const [specificDate, setSpecificDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const categories = ["All", "Offering", "Tithe", "Missions", "Building", "Others"];
  const periods = ["All", "This Week", "This Month", "This Year", "Specific Date", "Certain Period"];

  const isWithinPeriod = (dateStr, period) => {
    if (period === "All") return true;
    const date = new Date(dateStr);
    const now = new Date();
    
    if (period === "This Week") {
      const startOfWeek = new Date(now);
      const daysSinceMonday = (now.getDay() + 6) % 7;
      startOfWeek.setDate(now.getDate() - daysSinceMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    }
    if (period === "This Month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (period === "This Year") {
      return date.getFullYear() === now.getFullYear();
    }
    if (period === "Specific Date") {
      if (!specificDate) return true;
      const selDate = new Date(specificDate);
      return date.getDate() === selDate.getDate() &&
             date.getMonth() === selDate.getMonth() &&
             date.getFullYear() === selDate.getFullYear();
    }
    if (period === "Certain Period") {
      if (!startDate && !endDate) return true;
      let afterStart = true;
      let beforeEnd = true;
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        afterStart = date >= sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        beforeEnd = date <= eDate;
      }
      return afterStart && beforeEnd;
    }
    return true;
  };

  const finalFilteredTransactions = transactions.filter(t => {
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || t.status === selectedStatus;
    const matchesPeriod = isWithinPeriod(t.createdAt, selectedPeriod);

    // Search filter: match against receipt number, member ID, or name
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const receipt = (t.mpesaReceiptNumber || "").toLowerCase();
      const memberId = (t.memberId || "").toLowerCase();
      const fullName = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase();
      matchesSearch = receipt.includes(q) || memberId.includes(q) || fullName.includes(q);
    }

    return matchesCategory && matchesStatus && matchesPeriod && matchesSearch;
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/admin/transactions", { headers: { Authorization: token } });
      setTransactions(res.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Transactions could not be loaded. Check the connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchTransactions(); else navigate("/admin-login"); }, [fetchTransactions, navigate, token]);

  const completedTotal = finalFilteredTransactions.filter(t => t.status === "Completed").reduce((sum, t) => sum + t.amount, 0);
  const pendingTotal = finalFilteredTransactions.filter(t => t.status === "Pending").reduce((sum, t) => sum + t.amount, 0);
  const failedTransactions = finalFilteredTransactions.filter(t => t.status === "Failed");
  const failedTotal = failedTransactions.reduce((sum, t) => sum + t.amount, 0);

  const displayPeriod = selectedPeriod === "Specific Date" && specificDate 
    ? specificDate 
    : selectedPeriod === "Certain Period" && (startDate || endDate)
      ? `${startDate || 'Start'} to ${endDate || 'End'}`
      : selectedPeriod;

  const buildTransactionDocument = () => ({
    title: `${selectedCategory} Financial Transactions`,
    subtitle: "Giving, receipts, and payment-status register",
    filters: { Category: selectedCategory, Status: selectedStatus, Period: displayPeriod, Search: searchQuery || "None" },
    summary: {
      "Total records": finalFilteredTransactions.length,
      "Completed value": formatKes(completedTotal),
      "Pending value": formatKes(pendingTotal),
      "Failed transactions": `${failedTransactions.length} (${formatKes(failedTotal)})`,
      "Completion rate": `${Math.round((finalFilteredTransactions.filter((item) => item.status === "Completed").length / finalFilteredTransactions.length) * 100)}%`,
    },
    columns: [
      { label: "Date", value: (item) => formatReportDate(item.createdAt, true) },
      { label: "Member ID", value: (item) => item.memberId || "Guest" },
      { label: "Member / Donor", value: (item) => `${item.firstName || "Guest"} ${item.lastName || ""}`.trim() },
      { label: "Phone", value: "phone" },
      { label: "Amount", value: (item) => formatKes(item.amount) },
      { label: "Category", value: "category" },
      { label: "M-Pesa Receipt", value: (item) => item.mpesaReceiptNumber || "—" },
      { label: "Checkout reference", value: (item) => item.checkoutRequestId || "—" },
      { label: "Status", value: "status" },
    ],
    rows: finalFilteredTransactions,
  });

  const downloadReport = () => {
    if (finalFilteredTransactions.length === 0) {
      alert("No transaction data available for the report.");
      return;
    }

    if (downloadWordReport) {
      downloadWordReport(buildTransactionDocument());
      return;
    }

    const totalCompleted = finalFilteredTransactions
      .filter(t => t.status === "Completed")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPending = finalFilteredTransactions
      .filter(t => t.status === "Pending")
      .reduce((sum, t) => sum + t.amount, 0);

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Transaction Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 10pt; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h1 { text-align: center; color: #0369a1; font-size: 18pt; margin-bottom: 5pt; }
        h2 { text-align: center; color: #475569; font-size: 14pt; margin-top: 0; }
        p { text-align: center; color: #64748b; font-size: 10pt; }
        .summary { margin-top: 20pt; font-weight: bold; }
      </style>
      </head>
      <body>
        <h1>Outreach Hope Church</h1>
        <h2>${selectedCategory} Transaction Report (${displayPeriod})</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Amount (KES)</th>
              <th>Category</th>
              <th>Receipt</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${finalFilteredTransactions.map(t => `
              <tr>
                <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                <td>${t.memberId || "0000"}</td>
                <td>${t.firstName} ${t.lastName}</td>
                <td>${t.phone}</td>
                <td>${t.amount.toLocaleString()}</td>
                <td>${t.category}</td>
                <td>${t.mpesaReceiptNumber || "N/A"}</td>
                <td>${t.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <p style="text-align:left">SUMMARY REPORT</p>
          <p style="text-align:left">Total Transactions: ${finalFilteredTransactions.length}</p>
          <p style="text-align:left">Total Completed: KES ${totalCompleted.toLocaleString()}</p>
          <p style="text-align:left">Total Pending: KES ${totalPending.toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_${selectedCategory}_${displayPeriod.replace(/ /g, "_")}_Report_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (finalFilteredTransactions.length === 0) {
      alert("No transaction data available for the report.");
      return;
    }

    if (downloadCsvReport) {
      downloadCsvReport({
        title: `${selectedCategory} Financial Transactions`,
        filters: { Category: selectedCategory, Status: selectedStatus, Period: displayPeriod, Search: searchQuery || "None" },
        headers: ["Date", "Member ID", "First Name", "Last Name", "Phone", "Amount (KES)", "Category", "M-Pesa Receipt", "Checkout Reference", "Status"],
        rows: finalFilteredTransactions.map((item) => [
          formatReportDate(item.createdAt, true),
          item.memberId || "Guest",
          item.firstName || "Guest",
          item.lastName || "",
          item.phone || "",
          item.amount,
          item.category || "",
          item.mpesaReceiptNumber || "",
          item.checkoutRequestId || "",
          item.status || "",
        ]),
        summary: {
          "Total records": finalFilteredTransactions.length,
          "Completed value": formatKes(completedTotal),
          "Pending value": formatKes(pendingTotal),
          "Failed transactions": `${failedTransactions.length} (${formatKes(failedTotal)})`,
        },
      });
      return;
    }

    const headers = ["Date", "Member ID", "First Name", "Last Name", "Phone Number", "Amount (KES)", "Category", "M-Pesa Receipt", "Status"];
    const rows = finalFilteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString().replace(/,/g, ""),
      t.memberId || "0000",
      t.firstName || "Guest",
      t.lastName || "",
      t.phone,
      t.amount,
      t.category,
      t.mpesaReceiptNumber || "N/A",
      t.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
      "",
      "SUMMARY REPORT",
      `Category,${selectedCategory}`,
      `Period,${displayPeriod}`,
      `Total Transactions,${finalFilteredTransactions.length}`,
      `Total Completed Amount,KES ${completedTotal.toLocaleString()}`,
      `Total Pending Amount,KES ${pendingTotal.toLocaleString()}`
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_${selectedCategory}_${displayPeriod.replace(/ /g, "_")}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (finalFilteredTransactions.length === 0) {
      alert("No transaction data available for the PDF report.");
      return;
    }
    downloadPdfReport(buildTransactionDocument());
  };

  return (
    <div style={styles.page}>
      <PrintStyle />
      <header style={styles.header} className="no-print">
        <div style={styles.headerLeft}><div><h2 style={styles.headerTitle}>💰 Transactions</h2><p style={styles.headerSubtitle}>M-Pesa giving records</p></div></div>
        <button className="back-btn" onClick={() => navigate("/admin-dashboard")} style={styles.backBtn}>← Back to Dashboard</button>
      </header>
      <main style={styles.main}>
        {error && (
          <div role="alert" style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: "#fecaca", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span>{error}</span>
            <button type="button" onClick={fetchTransactions} style={{ ...styles.backBtn, padding: "7px 13px" }}>Retry</button>
          </div>
        )}

        {/* Print Header */}
        <div className="print-only" style={{ display: "none", textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#0369a1", margin: "0 0 5px" }}>Outreach Hope Church</h1>
          <h2 style={{ color: "#475569", fontSize: "1.2rem", margin: 0 }}>
            {selectedCategory} Transaction Report ({displayPeriod})
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Generated on: {new Date().toLocaleString()}</p>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryRow}>
          <div style={styles.summaryCard("#10b981")} className="summary-card">
            <span style={styles.summaryNumber("#059669")}>KES {completedTotal.toLocaleString()}</span>
            <span style={styles.summaryLabel}>{selectedCategory} Completed ({displayPeriod})</span>
          </div>
          <div style={styles.summaryCard("#f59e0b")} className="summary-card">
            <span style={styles.summaryNumber("#d97706")}>KES {pendingTotal.toLocaleString()}</span>
            <span style={styles.summaryLabel}>{selectedCategory} Pending ({displayPeriod})</span>
          </div>
          <div style={styles.summaryCard("#ef4444")} className="summary-card">
            <span style={styles.summaryNumber("#f87171")}>{failedTransactions.length}</span>
            <span style={styles.summaryLabel}>Failed · {formatKes(failedTotal)} requiring review</span>
          </div>
          <div style={styles.summaryCard("#0ea5e9")} className="summary-card">
            <span style={styles.summaryNumber("#0369a1")}>{finalFilteredTransactions.length}</span>
            <span style={styles.statLabel || styles.summaryLabel}>{selectedCategory} Records ({displayPeriod})</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="no-print" style={{
          marginBottom: "24px",
          position: "relative",
          maxWidth: "480px",
        }}>
          <div style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
            fontSize: "1rem",
            pointerEvents: "none",
          }}>
            🔍
          </div>
          <input
            type="text"
            placeholder="Search by receipt number, member ID, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 42px",
              borderRadius: "12px",
              border: "1.5px solid rgba(255,255,255,0.1)",
              background: "rgba(30, 41, 59, 0.7)",
              backdropFilter: "blur(10px)",
              fontSize: "0.88rem",
              fontWeight: 500,
              color: "#e2e8f0",
              outline: "none",
              transition: "all 0.2s",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0ea5e9";
              e.target.style.boxShadow = "0 2px 16px rgba(14,165,233,0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", marginBottom: "24px" }} className="no-print">
          <h3 style={{ ...styles.sectionHeading, marginBottom: 0 }}>
            {selectedCategory === "All" ? "All Transactions" : `${selectedCategory} Records`}
            <span style={{ 
              marginLeft: "10px",
              background: "linear-gradient(90deg,#0369a1,#0ea5e9)", 
              color: "#fff", 
              borderRadius: "999px", 
              padding: "2px 12px", 
              fontSize: "0.75rem", 
              fontWeight: 700 
            }}>
              {finalFilteredTransactions.length}
            </span>
          </h3>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(30, 41, 59, 0.8)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#38bdf8",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <select
                aria-label="Filter transactions by status"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(30, 41, 59, 0.8)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#38bdf8",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {["All", "Completed", "Pending", "Failed"].map((status) => (
                  <option key={status} value={status}>{status} status</option>
                ))}
              </select>
            </div>

            {selectedPeriod === "Specific Date" && (
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(30, 41, 59, 0.8)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#38bdf8",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            )}

            {selectedPeriod === "Certain Period" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    background: "rgba(30, 41, 59, 0.8)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#38bdf8",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    background: "rgba(30, 41, 59, 0.8)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#38bdf8",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
              </div>
            )}

            <button 
              style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #10b981, #059669)" }}
              onClick={downloadCSV}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              📊 CSV
            </button>

            <button 
              style={styles.downloadBtn}
              onClick={downloadReport}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              📄 Word Doc
            </button>
            
            <button 
              style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #475569, #64748b)" }}
              onClick={handlePrint}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              PDF Report
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={styles.tabContainer} className="no-print">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              style={styles.tab(selectedCategory === cat)}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={styles.tableContainer} className="table-container">
          {loading ? (
            <div style={styles.emptyState}>Loading transaction records…</div>
          ) : finalFilteredTransactions.length === 0 ? (<div style={styles.emptyState}>No transactions match the current filters.</div>) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>First Name</th>
                  <th style={styles.th}>Last Name</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {finalFilteredTransactions.map((t) => (
                  <tr key={t._id}>
                    <td style={styles.td}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <span style={{ 
                        backgroundColor: "rgba(255,255,255,0.05)", 
                        color: "#94a3b8",
                        padding: "2px 6px", 
                        borderRadius: "4px", 
                        fontFamily: "monospace",
                        fontSize: "0.8rem"
                      }}>
                        {t.memberId || "0000"}
                      </span>
                    </td>
                    <td style={styles.td}>{t.firstName}</td>
                    <td style={styles.td}>{t.lastName}</td>
                    <td style={styles.td}>{t.phone}</td>
                    <td style={styles.td}>KES {t.amount}</td>
                    <td style={styles.td}>{t.category}</td>
                    <td style={styles.td}><span style={styles.statusBadge(t.status)}>{t.status}</span></td>
                    <td style={styles.td}>{t.mpesaReceiptNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminTransactions;

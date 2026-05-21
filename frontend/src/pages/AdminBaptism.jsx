import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  emptyState: { textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "0.9rem" },
  
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
  
  statusBadge: (status) => ({
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    background: status === "Completed" ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)",
    color: status === "Completed" ? "#4ade80" : "#facc15"
  }),

  actionBtn: {
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    transition: "all 0.2s",
    marginRight: "8px"
  },

  deleteBtn: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#f87171",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
    transition: "all 0.2s"
  }
};

const GlobalStyle = () => (
  <style>{`
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background: white !important; color: black !important; }
      .table-container { box-shadow: none !important; border: 1px solid #eee !important; background: white !important; }
      th { color: #000 !important; border-bottom: 1px solid #000 !important; }
      td { color: #000 !important; border-bottom: 1px solid #eee !important; }
    }
  `}</style>
);

function AdminBaptism() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/admin-login");
    else fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/baptism-requests", {
        headers: { Authorization: token }
      });
      setRequests(res.data);
    } catch (err) {
      setError("Failed to fetch baptism requests.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "Pending" ? "Completed" : "Pending";
    try {
      await axios.patch(`http://localhost:5000/api/admin/baptism-requests/${id}/status`, { status: nextStatus }, {
        headers: { Authorization: token }
      });
      fetchRequests();
    } catch (err) {
      alert("Error updating status.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this baptism request?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/baptism-requests/${id}`, {
        headers: { Authorization: token }
      });
      fetchRequests();
    } catch (err) {
      alert("Error deleting request.");
      console.error(err);
    }
  };

  const downloadReport = () => {
    if (!window.confirm("Are you sure you want to download the All Requests report?")) return;

    if (requests.length === 0) {
      alert("No baptism request data available for the report.");
      return;
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Baptism Request Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 11pt; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h1 { text-align: center; color: #0369a1; font-size: 18pt; margin-bottom: 5pt; }
        h2 { text-align: center; color: #475569; font-size: 14pt; margin-top: 0; }
        p { text-align: center; color: #64748b; font-size: 10pt; }
      </style>
      </head>
      <body>
        <h1>Outreach Hope Church</h1>
        <h2>Baptism Requests Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Age</th>
              <th>DOB</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Preferred Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(r => `
              <tr>
                <td>${r.fullName}</td>
                <td>${r.age || "—"}</td>
                <td>${r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : "—"}</td>
                <td>${r.email}</td>
                <td>${r.phone}</td>
                <td>${new Date(r.preferredDate).toLocaleDateString()}</td>
                <td>${r.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_Baptism_Requests_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCompletedReport = () => {
    if (!window.confirm("Are you sure you want to download the Baptized Members report?")) return;

    const completedRequests = requests.filter(r => r.status === "Completed");
    if (completedRequests.length === 0) {
      alert("No completed baptism requests available for the report.");
      return;
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Baptized Members Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 11pt; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h1 { text-align: center; color: #0369a1; font-size: 18pt; margin-bottom: 5pt; }
        h2 { text-align: center; color: #475569; font-size: 14pt; margin-top: 0; }
        p { text-align: center; color: #64748b; font-size: 10pt; }
      </style>
      </head>
      <body>
        <h1>Outreach Hope Church</h1>
        <h2>Baptized Members Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Age</th>
              <th>DOB</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Baptism Date</th>
            </tr>
          </thead>
          <tbody>
            ${completedRequests.map(r => `
              <tr>
                <td>${r.fullName}</td>
                <td>${r.age || "—"}</td>
                <td>${r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : "—"}</td>
                <td>${r.email}</td>
                <td>${r.phone}</td>
                <td>${new Date(r.preferredDate).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_Baptized_Members_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!window.confirm("Are you sure you want to download the Baptism Requests CSV report?")) return;

    if (requests.length === 0) {
      alert("No request data available for the report.");
      return;
    }

    const headers = ["Full Name", "Age", "DOB", "Email", "Phone", "Preferred Date", "Status"];
    const rows = requests.map(r => [
      r.fullName,
      r.age || "—",
      r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : "—",
      r.email,
      r.phone,
      new Date(r.preferredDate).toLocaleDateString(),
      r.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Outreach_Baptism_Requests_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.page}>
      <GlobalStyle />
      <header style={styles.header} className="no-print">
        <div style={styles.headerLeft}>
          <div>
            <h2 style={styles.headerTitle}>💧 Baptism Requests</h2>
            <p style={styles.headerSubtitle}>Manage holy baptism requests</p>
          </div>
        </div>
        <button onClick={() => navigate("/admin-dashboard")} style={styles.backBtn}>← Back to Dashboard</button>
      </header>

      <main style={styles.main}>
        {/* Print Header */}
        <div className="print-only" style={{ display: "none", textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#0369a1", margin: "0 0 5px" }}>Outreach Hope Church</h1>
          <h2 style={{ color: "#475569", fontSize: "1.2rem", margin: 0 }}>Baptism Requests Report</h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Generated on: {new Date().toLocaleString()}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }} className="no-print">
          <h3 style={{ ...styles.sectionHeading, marginBottom: 0 }}>
            Active Requests
            <span style={{ 
              marginLeft: "10px",
              background: "linear-gradient(90deg,#0369a1,#0ea5e9)", 
              color: "#fff", 
              borderRadius: "999px", 
              padding: "2px 12px", 
              fontSize: "0.75rem", 
              fontWeight: 700 
            }}>
              {requests.length}
            </span>
          </h3>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #10b981, #059669)" }} onClick={downloadCSV}>📊 CSV</button>
            <button style={styles.downloadBtn} onClick={downloadReport}>📄 All Requests Doc</button>
            <button style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #8b5cf6, #7c3aed)" }} onClick={downloadCompletedReport}>🎓 Baptized Members Doc</button>
            <button style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #475569, #64748b)" }} onClick={handlePrint}>🖨️ Print PDF</button>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }} className="no-print">
          <input
            type="text"
            list="baptism-names"
            placeholder="🔍 Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%", 
              maxWidth: "400px", 
              padding: "12px 16px", 
              borderRadius: "8px", 
              border: "1px solid rgba(255,255,255,0.1)", 
              background: "rgba(30, 41, 59, 0.8)", 
              color: "#fff", 
              outline: "none",
              fontSize: "0.9rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          />
          <datalist id="baptism-names">
            {requests.map(r => <option key={r._id} value={r.fullName} />)}
          </datalist>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#64748b" }}>Loading requests...</div>
        ) : error ? (
          <div style={{ color: "#ef4444", textAlign: "center" }}>{error}</div>
        ) : (
          <div style={styles.tableContainer} className="table-container">
            {requests.length === 0 ? (
              <div style={styles.emptyState}>No baptism requests submitted yet.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Full Name</th>
                    <th style={styles.th}>Age / DOB</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Preferred Date</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th} className="no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter(req => 
                    req.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    req.email.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((req) => (
                    <tr key={req._id}>
                      <td style={styles.td}>{req.fullName}</td>
                      <td style={styles.td}>
                        {req.age !== undefined && req.age !== null ? `${req.age} yrs` : "—"} 
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", marginLeft: "6px" }}>
                          ({req.dateOfBirth ? new Date(req.dateOfBirth).toLocaleDateString() : "—"})
                        </span>
                      </td>
                      <td style={styles.td}>{req.email}</td>
                      <td style={styles.td}>{req.phone}</td>
                      <td style={styles.td}>{new Date(req.preferredDate).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(req.status)}>{req.status}</span>
                      </td>
                      <td style={styles.td} className="no-print">
                        <button 
                          style={styles.actionBtn} 
                          onClick={() => handleUpdateStatus(req._id, req.status)}
                        >
                          {req.status === "Pending" ? "Complete" : "Set Pending"}
                        </button>
                        <button 
                          style={styles.deleteBtn} 
                          onClick={() => handleDelete(req._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminBaptism;

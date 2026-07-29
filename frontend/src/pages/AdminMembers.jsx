import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { downloadCsvReport, downloadPdfReport, downloadWordReport, formatReportDate, maskSensitiveId } from "../adminReports";

const styles = {
  page: { fontFamily: "'Poppins', 'Segoe UI', sans-serif", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", minHeight: "100vh", color: "#f8fafc" },
  header: { background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 32px", height: "68px", display: "flex", alignItems: "center", justifySpace: "between", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", position: "sticky", top: 0, zIndex: 100 },
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
  
  avatar: {
    width: "32px",
    height: "32px",
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    color: "#38bdf8",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 700,
  },

  /* Premium Filter Panel styles */
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    alignItems: "center",
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "18px 24px",
    borderRadius: "16px",
    marginBottom: "24px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  filterLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  filterSelect: {
    background: "rgba(15, 23, 42, 0.6)",
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "0.85rem",
    outline: "none",
    minWidth: "140px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterInput: {
    background: "rgba(15, 23, 42, 0.6)",
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.85rem",
    outline: "none",
    width: "90px",
    transition: "all 0.2s",
  },
  filterSearchInput: {
    background: "rgba(15, 23, 42, 0.6)",
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8.5px 14px 8.5px 38px",
    fontSize: "0.85rem",
    outline: "none",
    width: "300px",
    transition: "all 0.2s",
  },
  
  /* Tabs system */
  tabContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
    borderBottom: "1.5px solid rgba(255,255,255,0.05)",
    paddingBottom: "8px",
  },
  tabButton: (isActive) => ({
    background: isActive ? "linear-gradient(90deg, #0369a1, #0ea5e9)" : "transparent",
    color: isActive ? "#fff" : "#94a3b8",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: isActive ? "0 4px 12px rgba(14,165,233,0.25)" : "none",
  }),

  /* Table actions */
  deleteBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  restoreBtn: {
    background: "rgba(34, 197, 94, 0.15)",
    color: "#4ade80",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  editBtn: {
    background: "rgba(14, 165, 233, 0.14)",
    color: "#7dd3fc",
    border: "1px solid rgba(56, 189, 248, 0.28)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.05)",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
};

const getAdminToken = () => localStorage.getItem("adminToken") || localStorage.getItem("token");

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const ageFromDate = (value) => {
  if (!value) return "";
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "";
};

const memberEditValues = (member) => ({
  firstName: member.firstName || "",
  lastName: member.lastName || "",
  email: member.email || "",
  phone: member.phone || "",
  residence: member.residence || "",
  gender: member.gender || "",
  age: member.age ?? "",
  dateOfBirth: toDateInputValue(member.dateOfBirth),
  idNo: "",
  isBaptized: Boolean(member.isBaptized),
});

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
    .filter-in:focus {
      border-color: #0ea5e9 !important;
      box-shadow: 0 0 8px rgba(14,165,233,0.3);
    }
    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .action-btn:active {
      transform: translateY(0);
    }
    .member-edit-panel {
      margin-bottom: 24px;
      padding: 22px;
      border: 1px solid rgba(56, 189, 248, 0.22);
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.88);
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
    }
    .member-edit-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }
    .member-edit-heading h3 {
      margin: 3px 0;
      color: #f8fafc;
      font-size: 1.1rem;
    }
    .member-edit-heading p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.8rem;
    }
    .member-edit-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 15px;
    }
    .member-edit-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .member-edit-field label,
    .member-edit-checkbox span {
      color: #cbd5e1;
      font-size: 0.76rem;
      font-weight: 700;
    }
    .member-edit-field input,
    .member-edit-field select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      padding: 10px 11px;
      background: rgba(2, 6, 23, 0.55);
      color: #f8fafc;
      font: inherit;
      font-size: 0.84rem;
    }
    .member-edit-field input:focus,
    .member-edit-field select:focus {
      outline: 2px solid rgba(56, 189, 248, 0.55);
      outline-offset: 1px;
      border-color: #38bdf8;
    }
    .member-edit-field small {
      color: #64748b;
      font-size: 0.7rem;
      line-height: 1.4;
    }
    .member-edit-checkbox {
      display: flex;
      min-height: 42px;
      align-items: center;
      gap: 9px;
      align-self: end;
      padding: 0 4px;
    }
    .member-edit-checkbox input {
      width: 18px;
      height: 18px;
      accent-color: #0ea5e9;
    }
    .member-edit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    .member-edit-actions button,
    .member-edit-close {
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      padding: 9px 15px;
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .member-edit-actions .save {
      border-color: rgba(56, 189, 248, 0.32);
      background: linear-gradient(90deg, #0369a1, #0ea5e9);
      color: #fff;
    }
    .member-edit-actions button:disabled,
    .member-edit-close:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .member-edit-error {
      margin: 0 0 16px;
      padding: 10px 12px;
      border: 1px solid rgba(248, 113, 113, 0.25);
      border-radius: 8px;
      background: rgba(127, 29, 29, 0.13);
      color: #fca5a5;
      font-size: 0.8rem;
    }
    .member-row-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }
    .member-row-feedback {
      display: block;
      margin-top: 7px;
      max-width: 190px;
      color: #fca5a5;
      font-size: 0.7rem;
      line-height: 1.35;
    }
    .member-row-feedback.success {
      color: #86efac;
    }
    @media (max-width: 900px) {
      .member-edit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 620px) {
      .member-edit-grid { grid-template-columns: 1fr; }
      .member-edit-heading { flex-direction: column; }
      .member-edit-actions { flex-direction: column-reverse; }
      .member-edit-actions button { width: 100%; }
    }
  `}</style>
);

function AdminMembers() {
  const [activeMembers, setActiveMembers] = useState([]);
  const [deletedMembers, setDeletedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Active"); // "Active" | "Deleted"
  
  // Filters
  const [selectedGender, setSelectedGender] = useState("All");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [rowBusy, setRowBusy] = useState({ id: null, action: "" });
  const [rowFeedback, setRowFeedback] = useState({});
  const editFirstNameRef = useRef(null);

  const navigate = useNavigate();

  const refreshMembers = useCallback(async ({ silent = false } = {}) => {
    const token = getAdminToken();
    if (!token) {
      navigate("/admin-login");
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const [activeResponse, deletedResponse] = await Promise.all([
        axios.get("/auth/members", { headers: { Authorization: token } }),
        axios.get("/auth/members/deleted", { headers: { Authorization: token } }),
      ]);
      setActiveMembers(Array.isArray(activeResponse.data) ? activeResponse.data : []);
      setDeletedMembers(Array.isArray(deletedResponse.data) ? deletedResponse.data : []);
    } catch (requestError) {
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        navigate("/admin-login");
      } else {
        setError("Failed to fetch members. Please try again.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  useEffect(() => {
    if (editingMember) editFirstNameRef.current?.focus();
  }, [editingMember]);

  const setMemberFeedback = (id, type, message) => {
    setRowFeedback((current) => ({ ...current, [id]: { type, message } }));
  };

  const clearMemberFeedback = (id) => {
    setRowFeedback((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    const token = getAdminToken();
    clearMemberFeedback(id);
    setRowBusy({ id, action: "remove" });
    try {
      await axios.delete(`/auth/members/${id}`, {
        headers: { Authorization: token }
      });
      if (editingMember?._id === id) {
        setEditingMember(null);
        setEditForm(null);
      }
      await refreshMembers({ silent: true });
    } catch (err) {
      setMemberFeedback(id, "error", err.response?.data?.message || "Failed to remove this member.");
    } finally {
      setRowBusy({ id: null, action: "" });
    }
  };

  const handleRestoreMember = async (id) => {
    if (!window.confirm("Are you sure you want to restore this member?")) return;
    const token = getAdminToken();
    clearMemberFeedback(id);
    setRowBusy({ id, action: "restore" });
    try {
      await axios.patch(`/auth/members/${id}/restore`, {}, {
        headers: { Authorization: token }
      });
      await refreshMembers({ silent: true });
    } catch (err) {
      setMemberFeedback(id, "error", err.response?.data?.message || "Failed to restore this member.");
    } finally {
      setRowBusy({ id: null, action: "" });
    }
  };

  const startEditingMember = (member) => {
    setEditingMember(member);
    setEditForm(memberEditValues(member));
    setEditError("");
    clearMemberFeedback(member._id);
  };

  const cancelEditingMember = () => {
    setEditingMember(null);
    setEditForm(null);
    setEditError("");
  };

  const updateEditField = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      if (name === "dateOfBirth" && value) next.age = ageFromDate(value);
      return next;
    });
    setEditError("");
  };

  const handleSaveMember = async (event) => {
    event.preventDefault();
    if (!editingMember || !editForm) return;

    const token = getAdminToken();
    if (!token) {
      navigate("/admin-login");
      return;
    }

    const memberId = editingMember._id;
    clearMemberFeedback(memberId);
    setEditError("");
    setRowBusy({ id: memberId, action: "save" });

    const payload = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      residence: editForm.residence,
      gender: editForm.gender,
      age: editForm.age === "" ? null : Number(editForm.age),
      dateOfBirth: editForm.dateOfBirth,
      isBaptized: editForm.isBaptized,
    };
    if (editForm.idNo.trim()) payload.idNo = editForm.idNo.trim();

    try {
      const { data } = await axios.patch(`/auth/members/${memberId}`, payload, {
        headers: { Authorization: token }
      });
      const updatedMember = data.member;
      setActiveMembers((members) => members.map((member) => member._id === memberId ? updatedMember : member));
      setDeletedMembers((members) => members.map((member) => member._id === memberId ? updatedMember : member));
      setMemberFeedback(memberId, "success", "Member record updated.");
      cancelEditingMember();
    } catch (requestError) {
      const message = requestError.response?.data?.message || "The member record could not be updated.";
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        navigate("/admin-login");
      } else {
        setEditError(message);
        setMemberFeedback(memberId, "error", message);
      }
    } finally {
      setRowBusy({ id: null, action: "" });
    }
  };

  // Age Filtering & Gender Filtering logic
  const getFilteredList = () => {
    const list = activeTab === "Active" ? activeMembers : deletedMembers;
    return list.filter(m => {
      // Gender filter
      const matchesGender = selectedGender === "All" || m.gender === selectedGender;
      
      // Age filter
      let matchesAge = true;
      if (minAge) {
        if (!m.age || m.age < Number(minAge)) matchesAge = false;
      }
      if (maxAge) {
        if (!m.age || m.age > Number(maxAge)) matchesAge = false;
      }

      // Search filter (real-time)
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        const email = (m.email || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        const memberId = (m.memberId || "").toLowerCase();
        const idNo = (m.idNo || "").toLowerCase();
        const residence = (m.residence || "").toLowerCase();
        matchesSearch = fullName.includes(q) || 
                        email.includes(q) || 
                        phone.includes(q) || 
                        memberId.includes(q) || 
                        idNo.includes(q) ||
                        residence.includes(q);
      }
      
      return matchesGender && matchesAge && matchesSearch;
    });
  };

  const filteredMembers = getFilteredList();

  const buildMemberDocument = () => {
    const baptizedCount = filteredMembers.filter((member) => member.isBaptized).length;
    return {
      title: `${activeTab} Member Directory`,
      subtitle: "Membership, contact, demographic, and pastoral-care register",
      filters: {
        Gender: selectedGender,
        "Age range": `${minAge || "Any"} – ${maxAge || "Any"}`,
        Search: searchQuery || "None",
      },
      summary: {
        "Total members": filteredMembers.length,
        Baptized: baptizedCount,
        "Not baptized": filteredMembers.length - baptizedCount,
        "Residence recorded": `${Math.round((filteredMembers.filter((member) => member.residence).length / filteredMembers.length) * 100)}%`,
      },
      columns: [
        { label: "Member ID", value: (member) => member.memberId || "—" },
        { label: "Full name", value: (member) => `${member.firstName} ${member.lastName}` },
        { label: "Gender", value: (member) => member.gender || "—" },
        { label: "Age", value: (member) => member.age || "—" },
        { label: "National ID (masked)", value: (member) => maskSensitiveId(member.idNo) },
        { label: "Baptized", value: (member) => member.isBaptized ? "Yes" : "No" },
        { label: "Email", value: "email" },
        { label: "Phone", value: "phone" },
        { label: "Residence", value: (member) => member.residence || "Not provided" },
        { label: "Joined", value: (member) => formatReportDate(member.createdAt) },
      ],
      rows: filteredMembers,
    };
  };

  const downloadReport = () => {
    if (filteredMembers.length === 0) {
      alert("No matching member data available for the report.");
      return;
    }

    if (downloadWordReport) {
      downloadWordReport(buildMemberDocument());
      return;
    }

    const ageFilterText = (minAge || maxAge) 
      ? `Age Range: ${minAge || 0} - ${maxAge || "Any"}` 
      : "Age Range: All";
    const genderFilterText = `Gender: ${selectedGender}`;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${activeTab} Member Report</title>
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
        <h2>${activeTab} Members Report</h2>
        <p>Filters applied - ${genderFilterText} | ${ageFilterText}</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>Age</th>
              <th>National ID</th>
              <th>Baptized</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Area of Residence</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMembers.map(m => `
              <tr>
                <td>${m.memberId || "N/A"}</td>
                <td>${m.firstName} ${m.lastName}</td>
                <td>${m.gender || "N/A"}</td>
                <td>${m.age || "N/A"}</td>
                <td>${maskSensitiveId(m.idNo)}</td>
                <td>${m.isBaptized ? "Yes" : "No"}</td>
                <td>${m.email}</td>
                <td>${m.phone}</td>
                <td>${m.residence || "Not provided"}</td>
                <td>${new Date(m.createdAt).toLocaleDateString()}</td>
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
    link.download = `Outreach_${activeTab}_Members_Report_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (filteredMembers.length === 0) {
      alert("No matching member data available for the report.");
      return;
    }

    if (downloadCsvReport) {
      downloadCsvReport({
        title: `${activeTab} Member Directory`,
        filters: {
          Gender: selectedGender,
          "Age range": `${minAge || "Any"} – ${maxAge || "Any"}`,
          Search: searchQuery || "None",
        },
        headers: ["Member ID", "First Name", "Last Name", "Gender", "Age", "National ID (Masked)", "Baptized", "Email", "Phone", "Area of Residence", "Joined"],
        rows: filteredMembers.map((member) => [
          member.memberId || "",
          member.firstName,
          member.lastName,
          member.gender || "",
          member.age || "",
          maskSensitiveId(member.idNo),
          member.isBaptized ? "Yes" : "No",
          member.email,
          member.phone,
          member.residence || "Not provided",
          formatReportDate(member.createdAt),
        ]),
        summary: {
          "Total members": filteredMembers.length,
          Baptized: filteredMembers.filter((member) => member.isBaptized).length,
        },
      });
      return;
    }

    const headers = ["Member ID", "First Name", "Last Name", "Gender", "Age", "National ID", "Baptized", "Email", "Phone", "Area of Residence", "Joined Date"];
    const rows = filteredMembers.map(m => [
      m.memberId || "N/A",
      m.firstName,
      m.lastName,
      m.gender || "N/A",
      m.age || "N/A",
      maskSensitiveId(m.idNo),
      m.isBaptized ? "Yes" : "No",
      m.email,
      m.phone,
      m.residence || "Not provided",
      new Date(m.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement("a"));
    link.href = url;
    link.download = `Outreach_${activeTab}_Members_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (filteredMembers.length === 0) {
      alert("No matching member data available for the PDF report.");
      return;
    }
    downloadPdfReport(buildMemberDocument());
  };

  return (
    <div style={styles.page}>
      <GlobalStyle />
      <header style={styles.header} className="no-print">
        <div style={styles.headerLeft}>
          <div>
            <h2 style={styles.headerTitle}>👥 Members</h2>
            <p style={styles.headerSubtitle}>Church registration records</p>
          </div>
        </div>
        <button onClick={() => navigate("/admin-dashboard")} style={styles.backBtn}>← Back to Dashboard</button>
      </header>

      <main style={styles.main}>
        {/* Print Header */}
        <div className="print-only" style={{ display: "none", textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#0369a1", margin: "0 0 5px" }}>Outreach Hope Church</h1>
          <h2 style={{ color: "#475569", fontSize: "1.2rem", margin: 0 }}>Registered Members Report</h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Generated on: {new Date().toLocaleString()}</p>
        </div>

        {/* Tabs for Active/Deleted views */}
        <div style={styles.tabContainer} className="no-print">
          <button 
            style={styles.tabButton(activeTab === "Active")} 
            onClick={() => { cancelEditingMember(); setActiveTab("Active"); }}
          >
            Active Directory ({activeMembers.length})
          </button>
          <button 
            style={styles.tabButton(activeTab === "Deleted")} 
            onClick={() => { cancelEditingMember(); setActiveTab("Deleted"); }}
          >
            Deleted History ({deletedMembers.length})
          </button>
        </div>

        {/* Precision Filter Panel */}
        <div style={styles.filterBar} className="no-print">
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search Members</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.9rem",
                pointerEvents: "none",
                color: "#64748b",
              }}>🔍</span>
              <input
                type="text"
                className="filter-in"
                placeholder="Name, residence, email, phone, ID..."
                style={styles.filterSearchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "10px",
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
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Gender</label>
            <select
              style={styles.filterSelect}
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Min Age</label>
            <input
              type="number"
              className="filter-in"
              placeholder="e.g. 18"
              style={styles.filterInput}
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              min="0"
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Max Age</label>
            <input
              type="number"
              className="filter-in"
              placeholder="e.g. 35"
              style={styles.filterInput}
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              min="0"
            />
          </div>

          <button 
            style={{ 
              background: "rgba(255,255,255,0.05)", 
              color: "#fff", 
              border: "1px solid rgba(255,255,255,0.1)", 
              borderRadius: "8px", 
              padding: "8px 16px", 
              fontSize: "0.8rem", 
              fontWeight: 600, 
              cursor: "pointer", 
              marginLeft: "auto" 
            }}
            onClick={() => {
              setSelectedGender("All");
              setMinAge("");
              setMaxAge("");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }} className="no-print">
          <h3 style={{ ...styles.sectionHeading, marginBottom: 0 }}>
            {activeTab === "Active" ? "Member Directory" : "Deleted Archives"}
            <span style={{ 
              marginLeft: "10px",
              background: "linear-gradient(90deg,#0369a1,#0ea5e9)", 
              color: "#fff", 
              borderRadius: "999px", 
              padding: "2px 12px", 
              fontSize: "0.75rem", 
              fontWeight: 700 
            }}>
              {filteredMembers.length} Matching
            </span>
          </h3>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              style={styles.refreshBtn}
              onClick={() => refreshMembers()}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
            <button style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #10b981, #059669)" }} onClick={downloadCSV}>📊 CSV</button>
            <button style={styles.downloadBtn} onClick={downloadReport}>📄 Word Doc</button>
            <button style={{ ...styles.downloadBtn, background: "linear-gradient(90deg, #be123c, #e11d48)" }} onClick={handlePrint}>PDF Report</button>
          </div>
        </div>

        {editingMember && editForm && (
          <section
            className="member-edit-panel no-print"
            aria-labelledby="member-edit-title"
            aria-busy={rowBusy.id === editingMember._id && rowBusy.action === "save"}
          >
            <div className="member-edit-heading">
              <div>
                <p>Member ID {editingMember.memberId || "Not assigned"}</p>
                <h3 id="member-edit-title">Edit member directory record</h3>
                <p>Update contact, residence, demographic, and baptism information. Passwords are never displayed or changed here.</p>
              </div>
              <button
                type="button"
                className="member-edit-close"
                onClick={cancelEditingMember}
                disabled={rowBusy.id === editingMember._id}
                aria-label="Close member edit panel"
              >
                Close
              </button>
            </div>

            {editError && <div className="member-edit-error" role="alert">{editError}</div>}

            <form onSubmit={handleSaveMember}>
              <div className="member-edit-grid">
                <div className="member-edit-field">
                  <label htmlFor="member-edit-first-name">First name</label>
                  <input
                    ref={editFirstNameRef}
                    id="member-edit-first-name"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={updateEditField}
                    maxLength={80}
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-last-name">Last name</label>
                  <input
                    id="member-edit-last-name"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={updateEditField}
                    maxLength={80}
                    autoComplete="family-name"
                    required
                  />
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-email">Email address</label>
                  <input
                    id="member-edit-email"
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={updateEditField}
                    maxLength={254}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-phone">Phone number</label>
                  <input
                    id="member-edit-phone"
                    name="phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={updateEditField}
                    maxLength={30}
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-residence">Area of residence</label>
                  <input
                    id="member-edit-residence"
                    name="residence"
                    value={editForm.residence}
                    onChange={updateEditField}
                    maxLength={120}
                    autoComplete="street-address"
                    required
                  />
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-gender">Gender</label>
                  <select
                    id="member-edit-gender"
                    name="gender"
                    value={editForm.gender}
                    onChange={updateEditField}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-dob">Date of birth</label>
                  <input
                    id="member-edit-dob"
                    name="dateOfBirth"
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={updateEditField}
                  />
                  <small>Age is recalculated automatically when a birth date is supplied.</small>
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-age">Age</label>
                  <input
                    id="member-edit-age"
                    name="age"
                    type="number"
                    min="0"
                    max="120"
                    step="1"
                    value={editForm.age}
                    onChange={updateEditField}
                  />
                </div>
                <div className="member-edit-field">
                  <label htmlFor="member-edit-id">New national ID / passport</label>
                  <input
                    id="member-edit-id"
                    name="idNo"
                    value={editForm.idNo}
                    onChange={updateEditField}
                    maxLength={30}
                    placeholder={editingMember.idNo ? `Current: ${maskSensitiveId(editingMember.idNo)}` : "Not currently recorded"}
                    aria-describedby="member-edit-id-help"
                  />
                  <small id="member-edit-id-help">The current identifier remains masked. Leave blank to keep it unchanged.</small>
                </div>
                <label className="member-edit-checkbox" htmlFor="member-edit-baptized">
                  <input
                    id="member-edit-baptized"
                    name="isBaptized"
                    type="checkbox"
                    checked={editForm.isBaptized}
                    onChange={updateEditField}
                  />
                  <span>Member is baptized</span>
                </label>
              </div>

              <div className="member-edit-actions">
                <button
                  type="button"
                  onClick={cancelEditingMember}
                  disabled={rowBusy.id === editingMember._id}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save"
                  disabled={rowBusy.id === editingMember._id}
                >
                  {rowBusy.id === editingMember._id && rowBusy.action === "save" ? "Saving member…" : "Save member"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#38bdf8", fontWeight: 600 }}>Loading members...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "20px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", color: "#f87171" }}>{error}</div>
        ) : (
          <div style={styles.tableContainer} className="table-container">
            {filteredMembers.length === 0 ? (
              <div style={styles.emptyState}>No members match the current filter criteria.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Gender</th>
                    <th style={styles.th}>Age</th>
                    <th style={styles.th}>National ID (masked)</th>
                    <th style={styles.th}>Baptized</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Residence</th>
                    <th style={styles.th}>Joined</th>
                    <th style={styles.th} className="no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member._id} aria-busy={rowBusy.id === member._id}>
                      <td style={styles.td}>
                        <span style={{ 
                          backgroundColor: "rgba(255,255,255,0.05)", 
                          padding: "4px 8px", 
                          borderRadius: "6px", 
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          fontWeight: "700"
                        }}>
                          {member.memberId || "N/A"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontWeight: "600", color: "#f8fafc" }}>
                          <span style={styles.avatar}>{member.firstName[0].toUpperCase()}</span>
                          {member.firstName} {member.lastName}
                        </div>
                      </td>
                      <td style={styles.td}>{member.gender || "—"}</td>
                      <td style={styles.td}>{member.age || "—"}</td>
                      <td style={styles.td} title="Sensitive identifier masked for privacy">{maskSensitiveId(member.idNo)}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: member.isBaptized ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: member.isBaptized ? "#4ade80" : "#f87171"
                        }}>
                          {member.isBaptized ? "Yes" : "No"}
                        </span>
                      </td>
                      <td style={styles.td}>{member.email}</td>
                      <td style={styles.td}>{member.phone}</td>
                      <td style={styles.td}>{member.residence || "Not provided"}</td>
                      <td style={styles.td}>{new Date(member.createdAt).toLocaleDateString()}</td>
                      <td style={styles.td} className="no-print">
                        <div className="member-row-actions">
                          <button
                            type="button"
                            className="action-btn"
                            style={styles.editBtn}
                            onClick={() => startEditingMember(member)}
                            disabled={rowBusy.id === member._id}
                            aria-label={`Edit ${member.firstName} ${member.lastName}`}
                          >
                            {rowBusy.id === member._id && rowBusy.action === "save" ? "Saving…" : "Edit"}
                          </button>
                          {activeTab === "Active" ? (
                            <button
                              type="button"
                              className="action-btn"
                              style={styles.deleteBtn}
                              onClick={() => handleDeleteMember(member._id)}
                              disabled={rowBusy.id === member._id}
                            >
                              {rowBusy.id === member._id && rowBusy.action === "remove" ? "Removing…" : "🗑️ Remove"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="action-btn"
                              style={styles.restoreBtn}
                              onClick={() => handleRestoreMember(member._id)}
                              disabled={rowBusy.id === member._id}
                            >
                              {rowBusy.id === member._id && rowBusy.action === "restore" ? "Restoring…" : "🔄 Restore"}
                            </button>
                          )}
                        </div>
                        {rowFeedback[member._id] && (
                          <span
                            className={`member-row-feedback ${rowFeedback[member._id].type === "success" ? "success" : ""}`}
                            role={rowFeedback[member._id].type === "error" ? "alert" : "status"}
                          >
                            {rowFeedback[member._id].message}
                          </span>
                        )}
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

export default AdminMembers;

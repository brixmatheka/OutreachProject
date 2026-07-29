import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  downloadCsvReport,
  downloadPdfReport,
  downloadWordReport,
  formatKes,
  formatReportDate,
} from "../adminReports";

const PROJECT_STATUSES = [
  "Planned",
  "Upcoming",
  "Ongoing",
  "On Hold",
  "Completed",
  "Cancelled",
];

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "Ongoing",
  owner: "",
  startDate: "",
  endDate: "",
  budget: "",
  amountRaised: "",
  progress: "0",
};

const STATUS_TONES = {
  Planned: {
    background: "rgba(148,163,184,0.14)",
    color: "#cbd5e1",
    border: "rgba(148,163,184,0.25)",
  },
  Upcoming: {
    background: "rgba(139,92,246,0.14)",
    color: "#c4b5fd",
    border: "rgba(139,92,246,0.28)",
  },
  Ongoing: {
    background: "rgba(14,165,233,0.14)",
    color: "#7dd3fc",
    border: "rgba(14,165,233,0.28)",
  },
  "On Hold": {
    background: "rgba(245,158,11,0.14)",
    color: "#fbbf24",
    border: "rgba(245,158,11,0.28)",
  },
  Completed: {
    background: "rgba(34,197,94,0.14)",
    color: "#86efac",
    border: "rgba(34,197,94,0.28)",
  },
  Cancelled: {
    background: "rgba(239,68,68,0.14)",
    color: "#fca5a5",
    border: "rgba(239,68,68,0.28)",
  },
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const hasRecordedAmount = (value) =>
  value !== null && value !== undefined && value !== "";

const formatOptionalKes = (value) =>
  hasRecordedAmount(value) ? formatKes(value) : "Not set";

const projectAmount = (project, field) =>
  hasRecordedAmount(project[field]) ? Number(project[field]) || 0 : 0;

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; }
    .projects-admin {
      min-height: 100vh;
      background:
        radial-gradient(circle at 85% 0%, rgba(14, 165, 233, 0.13), transparent 30rem),
        linear-gradient(145deg, #07111f 0%, #0f172a 48%, #111827 100%);
      color: #e2e8f0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .projects-admin button,
    .projects-admin input,
    .projects-admin select,
    .projects-admin textarea { font: inherit; }
    .projects-admin__header {
      align-items: center;
      backdrop-filter: blur(18px);
      background: rgba(7, 17, 31, 0.9);
      border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      display: flex;
      gap: 20px;
      justify-content: space-between;
      min-height: 74px;
      padding: 12px clamp(18px, 4vw, 48px);
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .projects-admin__brand { display: flex; align-items: center; gap: 13px; min-width: 0; }
    .projects-admin__brand-mark {
      align-items: center;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      border-radius: 13px;
      box-shadow: 0 8px 28px rgba(14, 165, 233, 0.25);
      color: #fff;
      display: flex;
      flex: 0 0 42px;
      font-size: 1.15rem;
      font-weight: 800;
      height: 42px;
      justify-content: center;
    }
    .projects-admin__brand h1 {
      color: #f8fafc;
      font-size: clamp(1rem, 2vw, 1.25rem);
      margin: 0;
    }
    .projects-admin__brand p {
      color: #7dd3fc;
      font-size: .7rem;
      letter-spacing: .09em;
      margin: 3px 0 0;
      text-transform: uppercase;
    }
    .projects-admin__main {
      margin: 0 auto;
      max-width: 1240px;
      padding: clamp(22px, 4vw, 42px);
    }
    .projects-admin__intro {
      align-items: end;
      display: flex;
      gap: 24px;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .projects-admin__eyebrow {
      color: #38bdf8;
      font-size: .72rem;
      font-weight: 800;
      letter-spacing: .12em;
      margin: 0 0 8px;
      text-transform: uppercase;
    }
    .projects-admin__intro h2 {
      color: #fff;
      font-size: clamp(1.65rem, 4vw, 2.5rem);
      letter-spacing: -.035em;
      margin: 0;
    }
    .projects-admin__intro-copy {
      color: #94a3b8;
      line-height: 1.65;
      margin: 10px 0 0;
      max-width: 720px;
    }
    .projects-admin__stats {
      display: grid;
      gap: 13px;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      margin-bottom: 24px;
    }
    .projects-admin__stat {
      background: linear-gradient(145deg, rgba(30, 41, 59, .82), rgba(15, 23, 42, .78));
      border: 1px solid rgba(148, 163, 184, .13);
      border-radius: 16px;
      min-width: 0;
      padding: 17px;
    }
    .projects-admin__stat-label {
      color: #94a3b8;
      display: block;
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .projects-admin__stat-value {
      color: #f8fafc;
      display: block;
      font-size: clamp(1.08rem, 2vw, 1.45rem);
      font-weight: 800;
      margin-top: 7px;
      overflow-wrap: anywhere;
    }
    .projects-admin__panel {
      background: rgba(15, 23, 42, .78);
      border: 1px solid rgba(148, 163, 184, .14);
      border-radius: 20px;
      box-shadow: 0 22px 60px rgba(0, 0, 0, .19);
      margin-bottom: 24px;
      padding: clamp(18px, 3vw, 28px);
    }
    .projects-admin__panel-heading {
      align-items: flex-start;
      display: flex;
      gap: 16px;
      justify-content: space-between;
      margin-bottom: 22px;
    }
    .projects-admin__panel-heading h3 { color: #f8fafc; font-size: 1.05rem; margin: 0; }
    .projects-admin__panel-heading p {
      color: #94a3b8;
      font-size: .82rem;
      line-height: 1.5;
      margin: 5px 0 0;
    }
    .projects-admin__form-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .projects-admin__field {
      display: flex;
      flex-direction: column;
      gap: 7px;
      min-width: 0;
    }
    .projects-admin__field--span-2 { grid-column: span 2; }
    .projects-admin__field--full { grid-column: 1 / -1; }
    .projects-admin__field label { color: #cbd5e1; font-size: .78rem; font-weight: 700; }
    .projects-admin__hint { color: #64748b; font-size: .71rem; font-weight: 500; }
    .projects-admin__control {
      background: rgba(2, 6, 23, .54);
      border: 1px solid rgba(148, 163, 184, .2);
      border-radius: 10px;
      color: #f8fafc;
      min-height: 43px;
      outline: none;
      padding: 10px 12px;
      transition: border-color .16s, box-shadow .16s, background .16s;
      width: 100%;
    }
    .projects-admin__control::placeholder { color: #64748b; }
    .projects-admin__control:focus {
      background: rgba(2, 6, 23, .82);
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, .14);
    }
    textarea.projects-admin__control { min-height: 112px; resize: vertical; }
    .projects-admin__actions {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }
    .projects-admin__button {
      align-items: center;
      border: 1px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      font-size: .82rem;
      font-weight: 750;
      gap: 7px;
      justify-content: center;
      min-height: 39px;
      padding: 9px 15px;
      transition: background .16s, border-color .16s, color .16s, opacity .16s, transform .16s;
    }
    .projects-admin__button:hover:not(:disabled) { transform: translateY(-1px); }
    .projects-admin__button:disabled { cursor: not-allowed; opacity: .52; }
    .projects-admin__button--primary {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      box-shadow: 0 8px 22px rgba(14, 165, 233, .22);
      color: #fff;
    }
    .projects-admin__button--secondary {
      background: rgba(148, 163, 184, .08);
      border-color: rgba(148, 163, 184, .2);
      color: #e2e8f0;
    }
    .projects-admin__button--success {
      background: rgba(34, 197, 94, .1);
      border-color: rgba(34, 197, 94, .24);
      color: #86efac;
    }
    .projects-admin__button--danger {
      background: rgba(239, 68, 68, .1);
      border-color: rgba(239, 68, 68, .24);
      color: #fca5a5;
    }
    .projects-admin__button--danger:hover:not(:disabled) { background: rgba(239, 68, 68, .18); }
    .projects-admin__message {
      border: 1px solid;
      border-radius: 11px;
      font-size: .83rem;
      line-height: 1.5;
      margin-bottom: 16px;
      padding: 11px 14px;
    }
    .projects-admin__message--error {
      background: rgba(239, 68, 68, .09);
      border-color: rgba(239, 68, 68, .24);
      color: #fecaca;
    }
    .projects-admin__message--success {
      background: rgba(34, 197, 94, .09);
      border-color: rgba(34, 197, 94, .24);
      color: #bbf7d0;
    }
    .projects-admin__toolbar {
      align-items: end;
      display: grid;
      gap: 13px;
      grid-template-columns: minmax(220px, 1fr) minmax(170px, .35fr) auto;
    }
    .projects-admin__export-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    .projects-admin__result-meta {
      align-items: center;
      color: #94a3b8;
      display: flex;
      flex-wrap: wrap;
      font-size: .78rem;
      gap: 8px;
      justify-content: space-between;
      margin: 20px 0 14px;
    }
    .projects-admin__count {
      background: rgba(14, 165, 233, .12);
      border: 1px solid rgba(14, 165, 233, .22);
      border-radius: 999px;
      color: #7dd3fc;
      font-size: .75rem;
      font-weight: 750;
      padding: 4px 10px;
    }
    .projects-admin__list { display: grid; gap: 14px; }
    .projects-admin__project {
      background: linear-gradient(145deg, rgba(30, 41, 59, .72), rgba(15, 23, 42, .72));
      border: 1px solid rgba(148, 163, 184, .12);
      border-radius: 18px;
      padding: clamp(17px, 3vw, 23px);
      transition: border-color .18s, transform .18s;
    }
    .projects-admin__project:hover {
      border-color: rgba(56, 189, 248, .28);
      transform: translateY(-1px);
    }
    .projects-admin__project-top {
      align-items: flex-start;
      display: flex;
      gap: 18px;
      justify-content: space-between;
    }
    .projects-admin__project-title {
      color: #f8fafc;
      font-size: 1.05rem;
      line-height: 1.35;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .projects-admin__project-owner { color: #94a3b8; font-size: .77rem; margin: 5px 0 0; }
    .projects-admin__status {
      border: 1px solid;
      border-radius: 999px;
      flex: 0 0 auto;
      font-size: .7rem;
      font-weight: 800;
      letter-spacing: .025em;
      padding: 5px 10px;
    }
    .projects-admin__description {
      color: #cbd5e1;
      font-size: .85rem;
      line-height: 1.65;
      margin: 16px 0;
      white-space: pre-wrap;
    }
    .projects-admin__details {
      display: grid;
      gap: 9px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .projects-admin__detail {
      background: rgba(2, 6, 23, .36);
      border-radius: 10px;
      min-width: 0;
      padding: 10px 11px;
    }
    .projects-admin__detail-label {
      color: #64748b;
      display: block;
      font-size: .67rem;
      font-weight: 750;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .projects-admin__detail-value {
      color: #e2e8f0;
      display: block;
      font-size: .79rem;
      font-weight: 650;
      margin-top: 4px;
      overflow-wrap: anywhere;
    }
    .projects-admin__progress-row {
      align-items: center;
      display: grid;
      gap: 12px;
      grid-template-columns: 1fr auto;
      margin-top: 16px;
    }
    .projects-admin__progress-track {
      background: rgba(148, 163, 184, .14);
      border-radius: 999px;
      height: 8px;
      overflow: hidden;
    }
    .projects-admin__progress-fill {
      background: linear-gradient(90deg, #0284c7, #22c55e);
      border-radius: inherit;
      height: 100%;
      transition: width .25s ease;
    }
    .projects-admin__progress-value { color: #bae6fd; font-size: .78rem; font-weight: 800; }
    .projects-admin__project-footer {
      align-items: center;
      border-top: 1px solid rgba(148, 163, 184, .1);
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      margin-top: 17px;
      padding-top: 15px;
    }
    .projects-admin__timestamps { color: #64748b; font-size: .7rem; line-height: 1.5; }
    .projects-admin__project-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .projects-admin__empty {
      background: rgba(2, 6, 23, .25);
      border: 1px dashed rgba(148, 163, 184, .22);
      border-radius: 16px;
      color: #94a3b8;
      padding: 42px 20px;
      text-align: center;
    }
    .projects-admin__empty h4 { color: #e2e8f0; margin: 0 0 7px; }
    .projects-admin__empty p { font-size: .84rem; margin: 0; }
    .projects-admin__spinner {
      animation: projects-spin .8s linear infinite;
      border: 2px solid rgba(125, 211, 252, .25);
      border-radius: 50%;
      border-top-color: #7dd3fc;
      display: inline-block;
      height: 15px;
      width: 15px;
    }
    @keyframes projects-spin { to { transform: rotate(360deg); } }
    @media (max-width: 980px) {
      .projects-admin__stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .projects-admin__form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .projects-admin__toolbar { grid-template-columns: 1fr 1fr; }
      .projects-admin__export-actions { grid-column: 1 / -1; justify-content: flex-start; }
      .projects-admin__details { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .projects-admin__header { align-items: stretch; flex-direction: column; padding-block: 13px; }
      .projects-admin__header .projects-admin__button { width: 100%; }
      .projects-admin__intro { align-items: flex-start; flex-direction: column; }
      .projects-admin__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .projects-admin__stat:last-child { grid-column: 1 / -1; }
      .projects-admin__form-grid, .projects-admin__toolbar { grid-template-columns: 1fr; }
      .projects-admin__field--span-2, .projects-admin__field--full { grid-column: auto; }
      .projects-admin__export-actions { grid-column: auto; }
      .projects-admin__export-actions .projects-admin__button { flex: 1 1 140px; }
      .projects-admin__project-top { align-items: flex-start; flex-direction: column; gap: 9px; }
      .projects-admin__details { grid-template-columns: 1fr; }
      .projects-admin__project-footer { align-items: stretch; flex-direction: column; }
      .projects-admin__project-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .projects-admin__project-actions .projects-admin__button { padding-inline: 8px; }
    }
    @media (max-width: 400px) {
      .projects-admin__stats { grid-template-columns: 1fr; }
      .projects-admin__stat:last-child { grid-column: auto; }
      .projects-admin__project-actions { grid-template-columns: 1fr; }
    }
  `}</style>
);

function AdminProjects() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return undefined;
    }

    let active = true;
    axios.get("/projects")
      .then(({ data }) => {
        if (!active) return;
        setProjects(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message
          || "Projects could not be loaded. Please try again."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, token]);

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/projects");
      setProjects(Array.isArray(data) ? data : []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || "Projects could not be loaded. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;
      const matchesQuery = !normalizedQuery || [
        project.title,
        project.description,
        project.owner,
      ].some((value) =>
        String(value || "").toLowerCase().includes(normalizedQuery)
      );

      return matchesStatus && matchesQuery;
    });
  }, [projects, query, statusFilter]);

  const activeCount = projects.filter((project) =>
    ["Planned", "Upcoming", "Ongoing", "On Hold"].includes(project.status)
  ).length;
  const totalBudget = projects.reduce(
    (sum, project) => sum + projectAmount(project, "budget"),
    0
  );
  const totalRaised = projects.reduce(
    (sum, project) => sum + projectAmount(project, "amountRaised"),
    0
  );
  const averageProgress = projects.length
    ? Math.round(
      projects.reduce(
        (sum, project) => sum + (Number(project.progress) || 0),
        0
      ) / projects.length
    )
    : 0;

  const shareToWhatsApp = (project) => {
    const timeline = project.startDate || project.endDate
      ? `${project.startDate ? formatReportDate(project.startDate) : "Not set"} to ${
        project.endDate ? formatReportDate(project.endDate) : "Not set"
      }`
      : "To be confirmed";
    const message =
      `*OUTREACH HOPE CHURCH SUNSHINE*\n` +
      `*PROJECT UPDATE*\n\n` +
      `*Project:* ${String(project.title || "Church project").toUpperCase()}\n` +
      `*Status:* ${project.status || "Ongoing"}\n` +
      `*Progress:* ${Number(project.progress) || 0}%\n` +
      `*Timeline:* ${timeline}\n` +
      `${project.owner ? `*Project lead:* ${project.owner}\n` : ""}\n` +
      `*Details:*\n${project.description || "More information will be shared soon."}\n\n` +
      `Learn how to support us:\nhttps://outreachhopechurch.org/projects\n\n` +
      `#OHCProjects #KingdomBuilding #Sunshine`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "status" && value === "Completed"
        ? { progress: "100" }
        : {}),
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
  };

  const startEditing = (project) => {
    setEditingId(project._id);
    setForm({
      title: project.title || "",
      description: project.description || "",
      status: PROJECT_STATUSES.includes(project.status)
        ? project.status
        : "Ongoing",
      owner: project.owner || "",
      startDate: toDateInput(project.startDate),
      endDate: toDateInput(project.endDate),
      budget: hasRecordedAmount(project.budget) ? String(project.budget) : "",
      amountRaised: hasRecordedAmount(project.amountRaised)
        ? String(project.amountRaised)
        : "",
      progress: String(Number(project.progress) || 0),
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim()) {
      return "Project title and description are required.";
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      return "The project end date cannot be before its start date.";
    }

    const moneyFields = [
      ["Budget", form.budget],
      ["Amount raised", form.amountRaised],
    ];
    for (const [label, value] of moneyFields) {
      const number = Number(value);
      if (
        value !== ""
        && (!Number.isFinite(number) || number < 0 || number > 1_000_000_000_000)
      ) {
        return `${label} must be between KES 0 and KES 1 trillion.`;
      }
    }

    const progress = Number(form.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return "Progress must be a number between 0 and 100.";
    }
    if (form.status === "Completed" && progress < 100) {
      return "Completed projects must have 100% progress.";
    }
    return "";
  };

  const saveProject = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setNotice("");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      owner: form.owner.trim(),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      budget: form.budget === "" ? null : Number(form.budget),
      amountRaised:
        form.amountRaised === "" ? null : Number(form.amountRaised),
      progress: Number(form.progress),
    };

    try {
      setSaving(true);
      setError("");
      setNotice("");
      const response = editingId
        ? await axios.patch(`/projects/${editingId}`, payload, {
          headers: { Authorization: token },
        })
        : await axios.post("/projects", payload, {
          headers: { Authorization: token },
        });
      const savedProject = response.data?.project || {
        ...payload,
        _id: editingId,
      };
      const wasEditing = Boolean(editingId);
      resetForm();
      await refreshProjects();
      setNotice(
        wasEditing
          ? "Project record updated successfully."
          : "Project record created successfully."
      );
      if (!wasEditing) shareToWhatsApp(savedProject);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || `The project could not be ${editingId ? "updated" : "created"}.`
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (project) => {
    const confirmed = window.confirm(
      `Delete "${project.title}"? This permanently removes the project record and cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(project._id);
      setError("");
      setNotice("");
      await axios.delete(`/projects/${project._id}`, {
        headers: { Authorization: token },
      });
      setProjects((current) =>
        current.filter((item) => item._id !== project._id)
      );
      if (editingId === project._id) resetForm();
      setNotice(`"${project.title}" was deleted.`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || "The project could not be deleted."
      );
    } finally {
      setDeletingId("");
    }
  };

  const getReportFilters = () => ({
    Status: statusFilter === "All" ? "All lifecycle statuses" : statusFilter,
    Search: query.trim() || "None",
  });

  const getReportSummary = () => {
    const filteredBudget = filteredProjects.reduce(
      (sum, project) => sum + projectAmount(project, "budget"),
      0
    );
    const filteredRaised = filteredProjects.reduce(
      (sum, project) => sum + projectAmount(project, "amountRaised"),
      0
    );
    const filteredAverage = filteredProjects.length
      ? Math.round(
        filteredProjects.reduce(
          (sum, project) => sum + (Number(project.progress) || 0),
          0
        ) / filteredProjects.length
      )
      : 0;

    return {
      "Projects in register": filteredProjects.length,
      Completed: filteredProjects.filter(
        (project) => project.status === "Completed"
      ).length,
      "Total budget": formatKes(filteredBudget),
      "Amount raised": formatKes(filteredRaised),
      "Average progress": `${filteredAverage}%`,
    };
  };

  const ensureReportRows = () => {
    if (filteredProjects.length) return true;
    setError(
      "No projects match the current filters, so there is nothing to export."
    );
    setNotice("");
    return false;
  };

  const downloadProjectsCsv = () => {
    if (!ensureReportRows()) return;
    downloadCsvReport({
      title: "Projects Programme and Financial Register",
      filters: getReportFilters(),
      summary: getReportSummary(),
      headers: [
        "Project",
        "Project lead",
        "Status",
        "Start date",
        "End date",
        "Budget",
        "Amount raised",
        "Progress",
        "Created",
        "Last updated",
        "Description",
      ],
      rows: filteredProjects.map((project) => [
        project.title || "",
        project.owner || "",
        project.status || "",
        project.startDate ? formatReportDate(project.startDate) : "",
        project.endDate ? formatReportDate(project.endDate) : "",
        hasRecordedAmount(project.budget)
          ? projectAmount(project, "budget")
          : "",
        hasRecordedAmount(project.amountRaised)
          ? projectAmount(project, "amountRaised")
          : "",
        `${Number(project.progress) || 0}%`,
        formatReportDate(project.createdAt, true),
        formatReportDate(project.updatedAt, true),
        project.description || "",
      ]),
    });
  };

  const getProjectsDocument = () => ({
      title: "Projects Programme and Financial Report",
      subtitle:
        "Organizational project pipeline, delivery progress, and resource stewardship register",
      filters: getReportFilters(),
      summary: getReportSummary(),
      columns: [
        { label: "Project", value: (project) => project.title || "—" },
        {
          label: "Lead",
          value: (project) => project.owner || "Not assigned",
        },
        { label: "Status", value: (project) => project.status || "—" },
        {
          label: "Timeline",
          value: (project) =>
            `${
              project.startDate
                ? formatReportDate(project.startDate)
                : "Not set"
            } – ${
              project.endDate ? formatReportDate(project.endDate) : "Not set"
            }`,
        },
        {
          label: "Budget",
          value: (project) => formatOptionalKes(project.budget),
        },
        {
          label: "Raised",
          value: (project) => formatOptionalKes(project.amountRaised),
        },
        {
          label: "Progress",
          value: (project) => `${Number(project.progress) || 0}%`,
        },
        {
          label: "Updated",
          value: (project) => formatReportDate(project.updatedAt, true),
        },
        {
          label: "Description",
          value: (project) => project.description || "—",
        },
      ],
      rows: filteredProjects,
    });

  const downloadProjectsWord = () => {
    if (!ensureReportRows()) return;
    downloadWordReport(getProjectsDocument());
  };

  const downloadProjectsPdf = () => {
    if (!ensureReportRows()) return;
    downloadPdfReport(getProjectsDocument());
  };

  return (
    <div className="projects-admin">
      <GlobalStyle />
      <header className="projects-admin__header">
        <div className="projects-admin__brand">
          <div className="projects-admin__brand-mark" aria-hidden="true">P</div>
          <div>
            <h1>Projects Administration</h1>
            <p>Programme delivery and stewardship</p>
          </div>
        </div>
        <button
          type="button"
          className="projects-admin__button projects-admin__button--secondary"
          onClick={() => navigate("/admin-dashboard")}
        >
          ← Back to dashboard
        </button>
      </header>

      <main className="projects-admin__main">
        <section className="projects-admin__intro">
          <div>
            <p className="projects-admin__eyebrow">
              Organizational control centre
            </p>
            <h2>Projects register</h2>
            <p className="projects-admin__intro-copy">
              Plan programmes, assign accountability, track delivery and
              funding, and produce board-ready records from one operational
              workspace.
            </p>
          </div>
        </section>

        <section
          className="projects-admin__stats"
          aria-label="Project portfolio summary"
        >
          <div className="projects-admin__stat">
            <span className="projects-admin__stat-label">All projects</span>
            <strong className="projects-admin__stat-value">
              {projects.length}
            </strong>
          </div>
          <div className="projects-admin__stat">
            <span className="projects-admin__stat-label">
              Active pipeline
            </span>
            <strong className="projects-admin__stat-value">
              {activeCount}
            </strong>
          </div>
          <div className="projects-admin__stat">
            <span className="projects-admin__stat-label">
              Portfolio budget
            </span>
            <strong className="projects-admin__stat-value">
              {formatKes(totalBudget)}
            </strong>
          </div>
          <div className="projects-admin__stat">
            <span className="projects-admin__stat-label">Amount raised</span>
            <strong className="projects-admin__stat-value">
              {formatKes(totalRaised)}
            </strong>
          </div>
          <div className="projects-admin__stat">
            <span className="projects-admin__stat-label">
              Average progress
            </span>
            <strong className="projects-admin__stat-value">
              {averageProgress}%
            </strong>
          </div>
        </section>

        {error && (
          <div
            className="projects-admin__message projects-admin__message--error"
            role="alert"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            className="projects-admin__message projects-admin__message--success"
            role="status"
          >
            {notice}
          </div>
        )}

        <section
          className="projects-admin__panel"
          aria-labelledby="project-form-heading"
        >
          <div className="projects-admin__panel-heading">
            <div>
              <h3 id="project-form-heading">
                {editingId ? "Edit project record" : "Register a project"}
              </h3>
              <p>
                {editingId
                  ? "Update the project’s delivery, accountability, and financial information."
                  : "Create a structured record that can be tracked through its full lifecycle."}
              </p>
            </div>
            {editingId && (
              <span className="projects-admin__count">Editing</span>
            )}
          </div>

          <form onSubmit={saveProject}>
            <div className="projects-admin__form-grid">
              <div className="projects-admin__field projects-admin__field--span-2">
                <label htmlFor="project-title">Project title</label>
                <input
                  id="project-title"
                  className="projects-admin__control"
                  maxLength={180}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  placeholder="e.g. Community water access programme"
                  required
                  value={form.title}
                />
              </div>
              <div className="projects-admin__field">
                <label htmlFor="project-owner">Project lead / owner</label>
                <input
                  id="project-owner"
                  className="projects-admin__control"
                  maxLength={160}
                  onChange={(event) =>
                    updateForm("owner", event.target.value)
                  }
                  placeholder="Responsible ministry or person"
                  value={form.owner}
                />
              </div>
              <div className="projects-admin__field">
                <label htmlFor="project-status">Lifecycle status</label>
                <select
                  id="project-status"
                  className="projects-admin__control"
                  onChange={(event) =>
                    updateForm("status", event.target.value)
                  }
                  value={form.status}
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="projects-admin__field">
                <label htmlFor="project-start">Start date</label>
                <input
                  id="project-start"
                  className="projects-admin__control"
                  onChange={(event) =>
                    updateForm("startDate", event.target.value)
                  }
                  type="date"
                  value={form.startDate}
                />
              </div>
              <div className="projects-admin__field">
                <label htmlFor="project-end">Target / end date</label>
                <input
                  id="project-end"
                  className="projects-admin__control"
                  min={form.startDate || undefined}
                  onChange={(event) =>
                    updateForm("endDate", event.target.value)
                  }
                  type="date"
                  value={form.endDate}
                />
              </div>
              <div className="projects-admin__field">
                <label htmlFor="project-budget">
                  Approved budget (KES)
                </label>
                <input
                  id="project-budget"
                  className="projects-admin__control"
                  min="0"
                  onChange={(event) =>
                    updateForm("budget", event.target.value)
                  }
                  placeholder="0"
                  step="1"
                  type="number"
                  value={form.budget}
                />
              </div>
              <div className="projects-admin__field">
                <label htmlFor="project-raised">
                  Amount raised (KES)
                </label>
                <input
                  id="project-raised"
                  className="projects-admin__control"
                  min="0"
                  onChange={(event) =>
                    updateForm("amountRaised", event.target.value)
                  }
                  placeholder="0"
                  step="1"
                  type="number"
                  value={form.amountRaised}
                />
              </div>

              <div className="projects-admin__field projects-admin__field--full">
                <label htmlFor="project-progress">
                  Delivery progress: {Number(form.progress) || 0}%
                  <span className="projects-admin__hint">
                    {" "}· Use the best verified completion estimate.
                  </span>
                </label>
                <input
                  id="project-progress"
                  max="100"
                  min="0"
                  onChange={(event) =>
                    updateForm("progress", event.target.value)
                  }
                  step="1"
                  type="range"
                  value={form.progress}
                />
              </div>

              <div className="projects-admin__field projects-admin__field--full">
                <label htmlFor="project-description">
                  Scope, beneficiaries, and delivery notes
                </label>
                <textarea
                  id="project-description"
                  className="projects-admin__control"
                  maxLength={5000}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe the need, intended outcome, beneficiaries, milestones, and any important delivery context."
                  required
                  value={form.description}
                />
              </div>
            </div>

            <div className="projects-admin__actions">
              <button
                className="projects-admin__button projects-admin__button--primary"
                disabled={saving}
                type="submit"
              >
                {saving && (
                  <span
                    className="projects-admin__spinner"
                    aria-hidden="true"
                  />
                )}
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create project"}
              </button>
              {editingId && (
                <button
                  className="projects-admin__button projects-admin__button--secondary"
                  disabled={saving}
                  onClick={resetForm}
                  type="button"
                >
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section
          className="projects-admin__panel"
          aria-labelledby="project-register-heading"
        >
          <div className="projects-admin__panel-heading">
            <div>
              <h3 id="project-register-heading">Programme register</h3>
              <p>
                Search, review, edit, communicate, and export the live project
                portfolio.
              </p>
            </div>
          </div>

          <div className="projects-admin__toolbar">
            <div className="projects-admin__field">
              <label htmlFor="project-search">Search projects</label>
              <input
                id="project-search"
                className="projects-admin__control"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, owner, or description"
                type="search"
                value={query}
              />
            </div>
            <div className="projects-admin__field">
              <label htmlFor="project-filter">Status</label>
              <select
                id="project-filter"
                className="projects-admin__control"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="All">All statuses</option>
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="projects-admin__export-actions">
              <button
                className="projects-admin__button projects-admin__button--danger"
                disabled={!filteredProjects.length}
                onClick={downloadProjectsPdf}
                type="button"
              >
                Export PDF
              </button>
              <button
                className="projects-admin__button projects-admin__button--secondary"
                disabled={!filteredProjects.length}
                onClick={downloadProjectsCsv}
                type="button"
              >
                Export CSV
              </button>
              <button
                className="projects-admin__button projects-admin__button--primary"
                disabled={!filteredProjects.length}
                onClick={downloadProjectsWord}
                type="button"
              >
                Export Word
              </button>
            </div>
          </div>

          <div className="projects-admin__result-meta">
            <span>
              Showing {filteredProjects.length} of {projects.length} project
              {projects.length === 1 ? "" : "s"}
            </span>
            {(query || statusFilter !== "All") && (
              <button
                className="projects-admin__button projects-admin__button--secondary"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("All");
                }}
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="projects-admin__empty" role="status">
              <span
                className="projects-admin__spinner"
                aria-hidden="true"
              />
              <p>Loading the projects register…</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="projects-admin__empty">
              <h4>
                {projects.length
                  ? "No matching projects"
                  : "No projects registered yet"}
              </h4>
              <p>
                {projects.length
                  ? "Change or clear the search filters to see more records."
                  : "Use the form above to create the organization’s first project record."}
              </p>
              {error && (
                <div
                  className="projects-admin__actions"
                  style={{ justifyContent: "center" }}
                >
                  <button
                    className="projects-admin__button projects-admin__button--secondary"
                    onClick={refreshProjects}
                    type="button"
                  >
                    Retry loading
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="projects-admin__list">
              {filteredProjects.map((project) => {
                const statusTone =
                  STATUS_TONES[project.status] || STATUS_TONES.Planned;
                const progress = Math.min(
                  100,
                  Math.max(0, Number(project.progress) || 0)
                );

                return (
                  <article
                    className="projects-admin__project"
                    key={project._id}
                  >
                    <div className="projects-admin__project-top">
                      <div>
                        <h4 className="projects-admin__project-title">
                          {project.title || "Untitled project"}
                        </h4>
                        <p className="projects-admin__project-owner">
                          {project.owner
                            ? `Accountable lead: ${project.owner}`
                            : "Accountable lead not assigned"}
                        </p>
                      </div>
                      <span
                        className="projects-admin__status"
                        style={{
                          background: statusTone.background,
                          borderColor: statusTone.border,
                          color: statusTone.color,
                        }}
                      >
                        {project.status || "Planned"}
                      </span>
                    </div>

                    <p className="projects-admin__description">
                      {project.description
                        || "No project description has been recorded."}
                    </p>

                    <div className="projects-admin__details">
                      <div className="projects-admin__detail">
                        <span className="projects-admin__detail-label">
                          Start date
                        </span>
                        <span className="projects-admin__detail-value">
                          {project.startDate
                            ? formatReportDate(project.startDate)
                            : "Not scheduled"}
                        </span>
                      </div>
                      <div className="projects-admin__detail">
                        <span className="projects-admin__detail-label">
                          Target / end
                        </span>
                        <span className="projects-admin__detail-value">
                          {project.endDate
                            ? formatReportDate(project.endDate)
                            : "Not scheduled"}
                        </span>
                      </div>
                      <div className="projects-admin__detail">
                        <span className="projects-admin__detail-label">
                          Approved budget
                        </span>
                        <span className="projects-admin__detail-value">
                          {formatOptionalKes(project.budget)}
                        </span>
                      </div>
                      <div className="projects-admin__detail">
                        <span className="projects-admin__detail-label">
                          Amount raised
                        </span>
                        <span className="projects-admin__detail-value">
                          {formatOptionalKes(project.amountRaised)}
                        </span>
                      </div>
                    </div>

                    <div className="projects-admin__progress-row">
                      <div
                        aria-label={`Project progress ${progress}%`}
                        aria-valuemax="100"
                        aria-valuemin="0"
                        aria-valuenow={progress}
                        className="projects-admin__progress-track"
                        role="progressbar"
                      >
                        <div
                          className="projects-admin__progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="projects-admin__progress-value">
                        {progress}% complete
                      </span>
                    </div>

                    <div className="projects-admin__project-footer">
                      <div className="projects-admin__timestamps">
                        Created {formatReportDate(project.createdAt, true)}
                        <br />
                        Updated {formatReportDate(project.updatedAt, true)}
                      </div>
                      <div className="projects-admin__project-actions">
                        <button
                          className="projects-admin__button projects-admin__button--secondary"
                          disabled={Boolean(deletingId)}
                          onClick={() => startEditing(project)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="projects-admin__button projects-admin__button--success"
                          disabled={Boolean(deletingId)}
                          onClick={() => shareToWhatsApp(project)}
                          type="button"
                        >
                          Share
                        </button>
                        <button
                          className="projects-admin__button projects-admin__button--danger"
                          disabled={Boolean(deletingId)}
                          onClick={() => deleteProject(project)}
                          type="button"
                        >
                          {deletingId === project._id
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminProjects;

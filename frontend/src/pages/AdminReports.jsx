import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { downloadCsvReport, downloadPdfReport, downloadWordReport, formatKes, formatReportDate } from "../adminReports";

const emptyOverview = {
  membership: { active: 0, inactive: 0, newLast30Days: 0 },
  finance: { completed: { count: 0, amount: 0 }, pending: { count: 0, amount: 0 }, failed: { count: 0, amount: 0 }, categories: [] },
  events: { upcoming: 0, past: 0, registrations: 0 },
  pastoralCare: { prayers: 0, unreadPrayers: 0 },
  baptism: { pending: 0, completed: 0 },
  sermons: { total: 0, published: 0, featured: 0, views: 0, downloads: 0 },
  media: { folders: 0, files: 0 },
  operations: { projects: 0, ministers: 0 },
};

const formatAuditFilters = (filters) => {
  if (!filters || typeof filters !== "object") return "No filters recorded";
  const entries = Object.entries(filters).filter(([, value]) => value !== "" && value != null);
  if (entries.length === 0) return "No filters recorded";
  return entries.map(([label, value]) => `${label}: ${String(value)}`).join(" · ");
};

export default function AdminReports() {
  const [overview, setOverview] = useState(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportAudit, setReportAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/api/admin/overview");
      setOverview({ ...emptyOverview, ...data });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "The organization overview could not be generated.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReportAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError("");
    try {
      const { data } = await axios.get("/api/admin/report-audit");
      setReportAudit(Array.isArray(data) ? data : Array.isArray(data?.logs) ? data.logs : []);
    } catch {
      setAuditError("Report history is temporarily unavailable. You can continue using the reporting tools.");
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadReportAudit();
  }, [loadOverview, loadReportAudit]);

  const reportRows = useMemo(() => [
    { area: "Membership", metric: "Active members", value: overview.membership.active, note: `${overview.membership.newLast30Days} joined in the last 30 days` },
    { area: "Membership", metric: "Inactive records", value: overview.membership.inactive, note: "Retained in administration history" },
    { area: "Finance", metric: "Completed giving", value: formatKes(overview.finance.completed.amount), note: `${overview.finance.completed.count} completed transactions` },
    { area: "Finance", metric: "Pending giving", value: formatKes(overview.finance.pending.amount), note: `${overview.finance.pending.count} pending transactions` },
    { area: "Finance", metric: "Failed transactions", value: overview.finance.failed.count, note: "Require operational review" },
    { area: "Programs", metric: "Upcoming events", value: overview.events.upcoming, note: `${overview.events.registrations} total event registrations` },
    { area: "Pastoral care", metric: "Prayer requests", value: overview.pastoralCare.prayers, note: `${overview.pastoralCare.unreadPrayers} unread` },
    { area: "Baptism", metric: "Completed baptisms", value: overview.baptism.completed, note: `${overview.baptism.pending} pending requests` },
    { area: "Teaching", metric: "Published sermons", value: overview.sermons.published, note: `${overview.sermons.views} views · ${overview.sermons.downloads} downloads` },
    { area: "Media", metric: "Gallery assets", value: overview.media.files, note: `${overview.media.folders} organized folders` },
    { area: "Operations", metric: "Projects", value: overview.operations.projects, note: `${overview.operations.ministers} ministry leaders listed` },
  ], [overview]);

  const getExecutiveDocument = () => ({
    title: "Executive Organization Report",
    subtitle: "Consolidated governance, ministry, finance, membership, and program overview",
    filters: { "Snapshot generated": formatReportDate(overview.generatedAt || new Date(), true) },
    summary: {
      "Active members": overview.membership.active,
      "Completed giving": formatKes(overview.finance.completed.amount),
      "Upcoming events": overview.events.upcoming,
      "Open pastoral items": overview.pastoralCare.unreadPrayers + overview.baptism.pending,
    },
    columns: [
      { label: "Organizational area", value: "area" },
      { label: "Key metric", value: "metric" },
      { label: "Current value", value: "value" },
      { label: "Management note", value: "note" },
    ],
    rows: reportRows,
  });
  const exportWord = () => downloadWordReport(getExecutiveDocument());
  const exportPdf = () => downloadPdfReport(getExecutiveDocument());

  const exportCsv = () => downloadCsvReport({
    title: "Executive Organization Report",
    filters: { "Snapshot generated": formatReportDate(overview.generatedAt || new Date(), true) },
    headers: ["Organizational Area", "Key Metric", "Current Value", "Management Note"],
    rows: reportRows.map((row) => [row.area, row.metric, row.value, row.note]),
  });

  const cards = [
    ["Active members", overview.membership.active, `+${overview.membership.newLast30Days} in 30 days`, "#38bdf8"],
    ["Completed giving", formatKes(overview.finance.completed.amount), `${overview.finance.completed.count} transactions`, "#34d399"],
    ["Upcoming events", overview.events.upcoming, `${overview.events.registrations} registrations`, "#fbbf24"],
    ["Open care items", overview.pastoralCare.unreadPrayers + overview.baptism.pending, "Prayer and baptism follow-up", "#c084fc"],
  ];

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <span>Governance &amp; accountability</span>
          <h1>Organization Reports</h1>
          <p>A live executive view of church operations and ministry performance.</p>
        </div>
        <div className="reports-header-actions">
          <button onClick={() => { loadOverview(); loadReportAudit(); }} disabled={loading || auditLoading}>
            {loading || auditLoading ? "Refreshing…" : "Refresh data"}
          </button>
          <Link to="/admin-dashboard">Back to dashboard</Link>
        </div>
      </header>

      <main className="reports-main">
        {error && <div className="reports-error" role="alert">{error}<button onClick={loadOverview}>Try again</button></div>}
        <div className="reports-meta">
          <span><b>Reporting basis</b> Live organizational records</span>
          <span><b>Generated</b> {formatReportDate(overview.generatedAt || new Date(), true)}</span>
          <span><b>Prepared by</b> {localStorage.getItem("adminName") || "Authorized administrator"}</span>
        </div>

        <section className="reports-kpis">
          {cards.map(([label, value, note, color]) => (
            <article key={label} style={{ "--accent": color }}>
              <span>{label}</span><strong>{loading ? "—" : value}</strong><small>{note}</small>
            </article>
          ))}
        </section>

        <section className="reports-grid">
          <article className="reports-panel reports-register">
            <div className="reports-panel-heading"><div><span>Executive register</span><h2>Operational snapshot</h2></div><span>{reportRows.length} indicators</span></div>
            <div className="reports-table-wrap">
              <table><thead><tr><th>Area</th><th>Metric</th><th>Value</th><th>Management note</th></tr></thead>
                <tbody>{reportRows.map((row) => <tr key={`${row.area}-${row.metric}`}><td>{row.area}</td><td>{row.metric}</td><td><b>{row.value}</b></td><td>{row.note}</td></tr>)}</tbody>
              </table>
            </div>
          </article>

          <aside className="reports-panel reports-export">
            <span>Controlled exports</span><h2>Generate board-ready files</h2>
            <p>Every document includes an organization letterhead, report ID, generation time, administrator, record totals, and approval line.</p>
            <button className="pdf" onClick={exportPdf} disabled={loading || Boolean(error)}>Generate PDF report</button>
            <button className="word" onClick={exportWord} disabled={loading || Boolean(error)}>Generate Word report</button>
            <button className="csv" onClick={exportCsv} disabled={loading || Boolean(error)}>Generate audit CSV</button>
            <small>Reports reflect the current database snapshot and should be reviewed before formal approval.</small>
          </aside>
        </section>

        {overview.finance.categories?.length > 0 && (
          <section className="reports-panel category-panel">
            <div className="reports-panel-heading"><div><span>Finance composition</span><h2>Completed giving by category</h2></div></div>
            <div className="category-grid">{overview.finance.categories.map((item) => (
              <div key={item.category}><span>{item.category}</span><strong>{formatKes(item.amount)}</strong><small>{item.count} transaction{item.count === 1 ? "" : "s"}</small></div>
            ))}</div>
          </section>
        )}

        <section className="reports-panel audit-panel" aria-labelledby="report-audit-heading">
          <div className="reports-panel-heading">
            <div>
              <span>Accountability trail</span>
              <h2 id="report-audit-heading">Recent report activity</h2>
            </div>
            <button className="audit-refresh" onClick={loadReportAudit} disabled={auditLoading}>
              {auditLoading ? "Loading…" : "Refresh history"}
            </button>
          </div>

          {auditLoading ? (
            <div className="audit-state" role="status">Loading recent report activity…</div>
          ) : auditError ? (
            <div className="audit-state audit-warning" role="status">
              <span>{auditError}</span>
              <button onClick={loadReportAudit}>Try again</button>
            </div>
          ) : reportAudit.length === 0 ? (
            <div className="audit-state">
              <strong>No report activity yet</strong>
              <span>Generated PDF, Word, and CSV reports will appear here for administrative review.</span>
            </div>
          ) : (
            <div className="reports-table-wrap audit-table">
              <table>
                <thead>
                  <tr>
                    <th>Generated</th>
                    <th>Report</th>
                    <th>Format</th>
                    <th>Records</th>
                    <th>Administrator</th>
                    <th>Report ID</th>
                  </tr>
                </thead>
                <tbody>
                  {reportAudit.map((entry) => (
                    <tr key={entry._id || entry.requestId}>
                      <td>{formatReportDate(entry.createdAt, true)}</td>
                      <td className="audit-report-name">
                        <strong>{entry.reportTitle || "Administrative report"}</strong>
                        <small>{formatAuditFilters(entry.filters)}</small>
                      </td>
                      <td><span className="audit-format">{String(entry.format || "unknown").toUpperCase()}</span></td>
                      <td>{Number.isFinite(Number(entry.recordCount)) ? Number(entry.recordCount).toLocaleString("en-KE") : "—"}</td>
                      <td>{entry.actorEmail || "Authorized administrator"}</td>
                      <td><code>{entry.reportId || entry.requestId || entry._id || "—"}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <style>{`
        .reports-page{min-height:100vh;background:#07111f;color:#e5eefb;font-family:Inter,Segoe UI,sans-serif}.reports-header{padding:34px clamp(18px,5vw,64px);background:linear-gradient(135deg,#082f49,#0f172a);border-bottom:1px solid rgba(125,211,252,.14);display:flex;justify-content:space-between;gap:24px;align-items:end;flex-wrap:wrap}.reports-header span,.reports-panel-heading span,.reports-export>span{color:#38bdf8;text-transform:uppercase;letter-spacing:.12em;font-size:.69rem;font-weight:900}.reports-header h1{font-size:clamp(1.8rem,4vw,3rem);margin:6px 0}.reports-header p{margin:0;color:#94a3b8}.reports-header-actions{display:flex;gap:10px;flex-wrap:wrap}.reports-header-actions button,.reports-header-actions a{padding:10px 14px;border-radius:10px;border:1px solid rgba(125,211,252,.18);background:rgba(14,165,233,.1);color:#e0f2fe;text-decoration:none;font:inherit;font-size:.82rem;font-weight:800;cursor:pointer}.reports-main{max-width:1400px;margin:auto;padding:28px clamp(14px,4vw,48px) 70px}.reports-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}.reports-meta span{background:rgba(30,41,59,.7);border:1px solid rgba(148,163,184,.1);padding:8px 11px;border-radius:9px;color:#94a3b8;font-size:.73rem}.reports-meta b{color:#cbd5e1;margin-right:5px}.reports-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}.reports-kpis article{background:rgba(15,23,42,.78);border:1px solid color-mix(in srgb,var(--accent) 28%,transparent);border-radius:16px;padding:19px;box-shadow:inset 3px 0 var(--accent)}.reports-kpis span,.reports-kpis small{display:block;color:#94a3b8;font-size:.74rem}.reports-kpis strong{display:block;color:var(--accent);font-size:clamp(1.35rem,3vw,2rem);margin:8px 0}.reports-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:20px;margin-bottom:20px}.reports-panel{background:rgba(15,23,42,.8);border:1px solid rgba(148,163,184,.1);border-radius:18px;padding:20px;box-shadow:0 20px 55px rgba(0,0,0,.2)}.reports-panel-heading{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:16px}.reports-panel h2{margin:5px 0 0}.reports-table-wrap{overflow:auto}.reports-register table,.audit-table table{width:100%;border-collapse:collapse;font-size:.8rem}.reports-register th,.audit-table th{text-align:left;color:#7dd3fc;padding:10px;border-bottom:1px solid rgba(125,211,252,.2)}.reports-register td,.audit-table td{padding:11px 10px;border-bottom:1px solid rgba(148,163,184,.07);color:#cbd5e1;vertical-align:top}.reports-export p{color:#94a3b8;line-height:1.6;font-size:.85rem}.reports-export button{width:100%;border:0;border-radius:11px;padding:12px;margin-top:10px;color:#fff;font-weight:900;cursor:pointer}.reports-export .pdf{background:linear-gradient(135deg,#be123c,#e11d48)}.reports-export .word{background:linear-gradient(135deg,#0284c7,#2563eb)}.reports-export .csv{background:linear-gradient(135deg,#059669,#047857)}.reports-export small{display:block;color:#64748b;line-height:1.5;margin-top:14px}.category-panel{margin-bottom:20px}.category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.category-grid div{padding:14px;border-radius:12px;background:rgba(30,41,59,.7)}.category-grid span,.category-grid small,.category-grid strong{display:block}.category-grid span,.category-grid small{color:#94a3b8;font-size:.72rem}.category-grid strong{color:#86efac;margin:7px 0}.reports-error{padding:13px;background:rgba(239,68,68,.12);color:#fca5a5;border-radius:12px;margin-bottom:16px}.reports-error button{float:right}.audit-refresh,.audit-state button{border:1px solid rgba(125,211,252,.2);border-radius:9px;padding:8px 11px;background:rgba(14,165,233,.09);color:#bae6fd;font:inherit;font-size:.75rem;font-weight:800;cursor:pointer}.audit-state{min-height:86px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;text-align:center;border:1px dashed rgba(148,163,184,.16);border-radius:12px;color:#94a3b8;font-size:.84rem}.audit-state strong{color:#cbd5e1}.audit-warning{color:#fbbf24;background:rgba(245,158,11,.05)}.audit-report-name strong,.audit-report-name small{display:block}.audit-report-name small{color:#64748b;margin-top:4px;max-width:460px}.audit-format{display:inline-block;border-radius:999px;padding:4px 8px;background:rgba(14,165,233,.1);color:#7dd3fc;font-size:.68rem;font-weight:900;letter-spacing:.08em}.audit-table code{color:#a5b4fc;font-size:.72rem;overflow-wrap:anywhere}@media(max-width:950px){.reports-kpis{grid-template-columns:repeat(2,1fr)}.reports-grid{grid-template-columns:1fr}}@media(max-width:520px){.reports-kpis{grid-template-columns:1fr}.reports-header{padding-top:24px}.reports-header-actions>*{flex:1}.reports-main{padding-top:18px}.reports-panel{padding:14px}.reports-panel-heading{align-items:flex-start;flex-direction:column}}
      `}</style>
    </div>
  );
}

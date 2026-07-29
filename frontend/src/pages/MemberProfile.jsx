import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const defaultPreferences = {
  theme: "dark",
  textSize: "comfortable",
  reducedMotion: false,
  eventReminders: true,
  sermonUpdates: true,
  prayerUpdates: true,
};

const loadPreferences = () => {
  try {
    return { ...defaultPreferences, ...JSON.parse(localStorage.getItem("memberPreferences") || "{}") };
  } catch {
    return defaultPreferences;
  }
};

export default function MemberProfile() {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "", residence: "", memberId: "" });
  const [preferences, setPreferences] = useState(loadPreferences);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    axios.get("/auth/me")
      .then(({ data }) => setProfile({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        residence: data.residence || "",
        memberId: data.memberId || "",
      }))
      .catch(() => setMessage({ type: "error", text: "Your profile could not be loaded. Please sign in again." }))
      .finally(() => setLoading(false));
  }, []);

  const completion = useMemo(() => {
    const fields = ["firstName", "lastName", "email", "phone", "residence"];
    return Math.round((fields.filter((field) => profile[field]).length / fields.length) * 100);
  }, [profile]);

  const updatePreference = (name, value) => {
    const next = { ...preferences, [name]: value };
    setPreferences(next);
    localStorage.setItem("memberPreferences", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("member-preferences-changed", { detail: next }));
    setMessage({ type: "success", text: "Preference saved on this device." });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await axios.patch("/auth/me", profile);
      setProfile((current) => ({ ...current, ...data.member }));
      localStorage.setItem("memberName", data.member.firstName);
      localStorage.setItem("memberLastName", data.member.lastName);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Profile update failed." });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.patch("/auth/me/password", passwords);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ type: "success", text: data.message });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Password change failed." });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    setSaving(true);
    try {
      await axios.post("/auth/logout");
    } catch {
      // Local cleanup still signs the member out if the server is unavailable.
    }
    ["memberSession", "memberToken", "memberName", "memberLastName", "memberId"].forEach((key) => localStorage.removeItem(key));
    window.location.href = "/";
  };

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "OH";

  return (
    <div className="member-profile-page">
      <div className="profile-orb profile-orb-one" />
      <div className="profile-orb profile-orb-two" />
      <header className="profile-topbar">
        <Link to="/" className="profile-home-link">← Home</Link>
        <div className="profile-top-actions">
          <button
            type="button"
            className="profile-theme-toggle"
            onClick={() => updatePreference("theme", preferences.theme === "dark" ? "light" : "dark")}
          >
            {preferences.theme === "dark" ? "☀ Light" : "◐ Dark"}
          </button>
          <span className="profile-secure">Protected member space · 2026</span>
        </div>
      </header>

      <main className="profile-shell">
        <aside className="profile-sidebar">
          <div className="profile-avatar">{initials}</div>
          <h1>{profile.firstName || "Your profile"}</h1>
          <p>Member #{profile.memberId || "—"}</p>
          <div className="profile-completion">
            <div><span>Profile completion</span><strong>{completion}%</strong></div>
            <progress max="100" value={completion}>{completion}%</progress>
          </div>
          <nav aria-label="Profile settings">
            {[
              ["profile", "Profile", "Personal details"],
              ["preferences", "Preferences", "Display & updates"],
              ["security", "Security", "Password & session"],
            ].map(([id, label, detail]) => (
              <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setMessage({ type: "", text: "" }); }}>
                <strong>{label}</strong><span>{detail}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="profile-panel">
          {message.text && <div className={`profile-message ${message.type}`} role="status">{message.text}</div>}
          {loading ? <div className="profile-loading">Loading your member space…</div> : (
            <>
              {tab === "profile" && (
                <form onSubmit={saveProfile}>
                  <div className="profile-heading"><span>Identity</span><h2>Personal profile</h2><p>Keep your church membership details current.</p></div>
                  <div className="profile-form-grid">
                    <label>First name<input required value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} /></label>
                    <label>Second name<input required value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} /></label>
                    <label>Email address<input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
                    <label>Phone number<input required type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
                    <label className="full">Area of residence<input required maxLength="120" value={profile.residence} onChange={(e) => setProfile({ ...profile, residence: e.target.value })} /></label>
                  </div>
                  <button className="profile-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                </form>
              )}

              {tab === "preferences" && (
                <div>
                  <div className="profile-heading"><span>Personalization</span><h2>Your experience</h2><p>Modern, device-aware controls that respect your needs.</p></div>
                  <div className="preference-row"><div><strong>Theme</strong><span>Follow your device or choose a mode.</span></div><select value={preferences.theme} onChange={(e) => updatePreference("theme", e.target.value)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></div>
                  <div className="preference-row"><div><strong>Text size</strong><span>Improve reading comfort across the site.</span></div><select value={preferences.textSize} onChange={(e) => updatePreference("textSize", e.target.value)}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></div>
                  <Toggle label="Reduce motion" detail="Minimize non-essential animation." checked={preferences.reducedMotion} onChange={(value) => updatePreference("reducedMotion", value)} />
                  <h3 className="preference-subtitle">Smart updates</h3>
                  <Toggle label="Event reminders" detail="Keep upcoming church events visible." checked={preferences.eventReminders} onChange={(value) => updatePreference("eventReminders", value)} />
                  <Toggle label="New sermon updates" detail="Get notified when new teaching is available." checked={preferences.sermonUpdates} onChange={(value) => updatePreference("sermonUpdates", value)} />
                  <Toggle label="Prayer request updates" detail="Receive relevant prayer activity updates." checked={preferences.prayerUpdates} onChange={(value) => updatePreference("prayerUpdates", value)} />
                </div>
              )}

              {tab === "security" && (
                <form onSubmit={changePassword}>
                  <div className="profile-heading"><span>Security</span><h2>Protect your account</h2><p>Use a unique password with at least eight characters.</p></div>
                  <div className="security-status"><span className="security-pulse" />Your member session is active and encrypted.</div>
                  <div className="profile-form-grid single">
                    <label>Current password<input required type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
                    <label>New password<input required minLength="8" type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></label>
                    <label>Confirm new password<input required minLength="8" type="password" autoComplete="new-password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} /></label>
                  </div>
                  <button className="profile-primary" disabled={saving}>{saving ? "Updating…" : "Change password"}</button>
                  <div className="session-actions">
                    <div><strong>Current session</strong><span>Sign out of your member account on this device.</span></div>
                    <button type="button" className="profile-logout" disabled={saving} onClick={logout}>Log out</button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </main>
      <ProfileStyles />
    </div>
  );
}

function Toggle({ label, detail, checked, onChange }) {
  return <div className="preference-row"><div><strong>{label}</strong><span>{detail}</span></div><button type="button" role="switch" aria-checked={checked} className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}><span /></button></div>;
}

function ProfileStyles() {
  return <style>{`
    .member-profile-page{min-height:100vh;background:#07111f;color:#e5eefb;font-family:Inter,Segoe UI,sans-serif;padding:24px;position:relative;overflow:hidden}.profile-orb{position:fixed;border-radius:50%;filter:blur(30px);pointer-events:none}.profile-orb-one{width:420px;height:420px;background:rgba(14,165,233,.13);top:-180px;right:-80px}.profile-orb-two{width:360px;height:360px;background:rgba(34,197,94,.08);bottom:-190px;left:-80px}.profile-topbar{max-width:1160px;margin:0 auto 24px;display:flex;justify-content:space-between;align-items:center;position:relative}.profile-home-link{color:#bae6fd;font-weight:800;text-decoration:none}.profile-secure{font-size:.75rem;color:#7dd3fc;border:1px solid rgba(125,211,252,.18);padding:7px 12px;border-radius:999px;background:rgba(14,165,233,.06)}.profile-shell{max-width:1160px;margin:auto;display:grid;grid-template-columns:280px minmax(0,1fr);gap:20px;position:relative}.profile-sidebar,.profile-panel{background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.12);box-shadow:0 30px 80px rgba(0,0,0,.3);backdrop-filter:blur(18px);border-radius:24px}.profile-sidebar{padding:26px;height:fit-content}.profile-avatar{width:72px;height:72px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(135deg,#0ea5e9,#2563eb);font-size:1.35rem;font-weight:900;box-shadow:0 14px 30px rgba(14,165,233,.25)}.profile-sidebar h1{font-size:1.35rem;margin:16px 0 2px}.profile-sidebar>p{margin:0;color:#94a3b8;font-size:.82rem}.profile-completion{margin:22px 0}.profile-completion div{display:flex;justify-content:space-between;font-size:.73rem;color:#94a3b8}.profile-completion progress{width:100%;height:7px;margin-top:8px;accent-color:#38bdf8}.profile-sidebar nav{display:grid;gap:8px}.profile-sidebar nav button{text-align:left;border:0;border-radius:14px;padding:13px;background:transparent;color:#cbd5e1;cursor:pointer}.profile-sidebar nav button.active{background:rgba(14,165,233,.13);color:#e0f2fe}.profile-sidebar nav strong,.profile-sidebar nav span{display:block}.profile-sidebar nav span{font-size:.72rem;color:#64748b;margin-top:2px}.profile-panel{padding:clamp(22px,4vw,42px);min-height:620px}.profile-heading>span{color:#38bdf8;text-transform:uppercase;letter-spacing:.13em;font-size:.7rem;font-weight:900}.profile-heading h2{font-size:clamp(1.6rem,4vw,2.35rem);margin:7px 0}.profile-heading p{color:#94a3b8;margin:0 0 28px}.profile-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.profile-form-grid.single{grid-template-columns:minmax(0,520px)}.profile-form-grid label{font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;font-weight:800}.profile-form-grid label.full{grid-column:1/-1}.profile-form-grid input,.preference-row select{display:block;width:100%;margin-top:7px;padding:13px 14px;border-radius:12px;border:1px solid rgba(148,163,184,.18);background:#0b1627;color:#f8fafc;font:inherit;outline:none}.profile-form-grid input:focus,.preference-row select:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.12)}.profile-primary{margin-top:22px;border:0;border-radius:12px;padding:13px 20px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:white;font-weight:900;cursor:pointer}.profile-primary:disabled{opacity:.55}.profile-message{padding:12px 15px;border-radius:12px;margin-bottom:20px;font-size:.86rem}.profile-message.success{background:rgba(34,197,94,.12);color:#86efac}.profile-message.error{background:rgba(239,68,68,.12);color:#fca5a5}.profile-loading{color:#94a3b8}.preference-row{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:17px 0;border-bottom:1px solid rgba(148,163,184,.1)}.preference-row strong,.preference-row span{display:block}.preference-row span{font-size:.78rem;color:#94a3b8;margin-top:3px}.preference-row select{width:150px;margin:0}.toggle{width:48px;height:27px;border:0;border-radius:99px;background:#334155;padding:3px;cursor:pointer;flex:0 0 auto}.toggle span{width:21px;height:21px;border-radius:50%;background:white;transition:transform .2s}.toggle.on{background:#0ea5e9}.toggle.on span{transform:translateX(21px)}.preference-subtitle{margin:28px 0 2px;color:#bae6fd;font-size:.9rem}.security-status{padding:13px 15px;background:rgba(34,197,94,.08);color:#86efac;border-radius:12px;margin-bottom:22px;font-size:.82rem}.security-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:9px;box-shadow:0 0 0 5px rgba(34,197,94,.1)}@media(max-width:760px){.member-profile-page{padding:14px}.profile-secure{display:none}.profile-shell{grid-template-columns:1fr}.profile-sidebar{padding:18px}.profile-sidebar nav{grid-template-columns:repeat(3,1fr)}.profile-sidebar nav button{padding:10px;text-align:center}.profile-sidebar nav span{display:none}.profile-panel{min-height:520px}.profile-form-grid{grid-template-columns:1fr}.profile-form-grid label.full{grid-column:auto}.preference-row{align-items:flex-start}.profile-heading h2{font-size:1.65rem}}@media(prefers-reduced-motion:reduce){.toggle span{transition:none}}
  `}</style>;
}

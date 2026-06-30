export const ADMIN_ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  TRANSACTIONS_ADMIN: "transactions_admin",
  EVENTS_ADMIN: "events_admin",
  MEDIA_PHOTOS_ADMIN: "media_photos_admin",
  CONTENT_ADMIN: "content_admin",
});

export const ADMIN_ROLE_LABELS = Object.freeze({
  [ADMIN_ROLES.SUPER_ADMIN]: "Super Admin",
  [ADMIN_ROLES.TRANSACTIONS_ADMIN]: "Transactions Admin",
  [ADMIN_ROLES.EVENTS_ADMIN]: "Events Admin",
  [ADMIN_ROLES.MEDIA_PHOTOS_ADMIN]: "Media/Photos Admin",
  [ADMIN_ROLES.CONTENT_ADMIN]: "Content Admin",
});

export const ADMIN_SECTION_ROLES = Object.freeze({
  dashboard: Object.values(ADMIN_ROLES),
  events: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.EVENTS_ADMIN],
  projects: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.CONTENT_ADMIN],
  prayerRequests: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.CONTENT_ADMIN],
  transactions: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.TRANSACTIONS_ADMIN],
  members: [ADMIN_ROLES.SUPER_ADMIN],
  baptism: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.CONTENT_ADMIN],
  sermons: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.CONTENT_ADMIN],
  gallery: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.MEDIA_PHOTOS_ADMIN],
  ministers: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.MEDIA_PHOTOS_ADMIN],
});

export function getAdminAuth() {
  let permissions = [];

  try {
    permissions = JSON.parse(localStorage.getItem("adminPermissions") || "[]");
  } catch {
    permissions = [];
  }

  const storedToken = [localStorage.getItem("adminToken"), localStorage.getItem("token")]
    .find((value) => value && !["null", "undefined", "cookie-session"].includes(value.toLowerCase()));

  return {
    token: storedToken || (localStorage.getItem("adminSession") ? "cookie-session" : null),
    role: localStorage.getItem("adminRole"),
    roleLabel: localStorage.getItem("adminRoleLabel"),
    permissions,
  };
}

export function canAccessAdminSection(section) {
  const { role } = getAdminAuth();
  return Boolean(role && ADMIN_SECTION_ROLES[section]?.includes(role));
}

export function storeAdminAuth(data) {
  const token = data?.token || [localStorage.getItem("adminToken"), localStorage.getItem("token")]
    .find((value) => value && !["null", "undefined", "cookie-session"].includes(value.toLowerCase()));
  const admin = data?.admin || {};

  localStorage.setItem("adminSession", "true");
  localStorage.setItem("token", token || "cookie-session");
  localStorage.setItem("adminToken", token || "cookie-session");
  if (admin.role) localStorage.setItem("adminRole", admin.role);
  if (admin.roleLabel) localStorage.setItem("adminRoleLabel", admin.roleLabel);
  if (admin.name) localStorage.setItem("adminName", admin.name);
  if (admin.permissions) localStorage.setItem("adminPermissions", JSON.stringify(admin.permissions));
}

export function clearAdminAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminSession");
  localStorage.removeItem("adminRole");
  localStorage.removeItem("adminRoleLabel");
  localStorage.removeItem("adminName");
  localStorage.removeItem("adminPermissions");
}

import axios from "axios";
import API_URL from "./config/api";

// Derive SITE_URL from environment for sharing links etc.
const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

const SESSION_PLACEHOLDER = "cookie-session";

const getStoredToken = (...keys) => {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && !["null", "undefined", SESSION_PLACEHOLDER].includes(value.toLowerCase())) {
      return value;
    }
  }
  return null;
};

const getRequestPath = (config) => {
  try {
    return new URL(config.url || "", config.baseURL || API_URL).pathname;
  } catch {
    return config.url || "";
  }
};

axios.interceptors.request.use((config) => {
  const existingAuth = config.headers?.Authorization;
  if (existingAuth && existingAuth !== SESSION_PLACEHOLDER) {
    return config;
  }

  const path = getRequestPath(config);
  const isAdminRequest =
    existingAuth === SESSION_PLACEHOLDER ||
    path.startsWith("/admin") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/auth/members") ||
    path.startsWith("/announcements");
  const token = isAdminRequest
    ? getStoredToken("adminToken", "token")
    : getStoredToken("memberToken");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  return config;
});

export { API_URL, SITE_URL };
export default axios;

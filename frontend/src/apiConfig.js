import axios from "axios";
import API_URL from "./config/api";

// Derive SITE_URL from environment for sharing links etc.
const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// Axios request interceptor: add Authorization header from localStorage
axios.interceptors.request.use((config) => {
  // If Authorization is already set in the request config, don't override it
  // This allows individual requests to use their own raw token without Bearer prefix
  if (config.headers.Authorization) {
    return config;
  }

  // Try admin token first, then member token
  const adminToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
  const memberToken = localStorage.getItem("memberToken");

  const token = adminToken || memberToken;

  if (token) {
    // Only add Bearer prefix if not already present
    if (!token.startsWith("Bearer ")) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers.Authorization = token;
    }
  }

  return config;
});

export { API_URL, SITE_URL };
export default axios;
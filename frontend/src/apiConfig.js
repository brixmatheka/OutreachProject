import axios from "axios";
import API_URL from "./config/api";

// Derive SITE_URL from environment for sharing links etc.
const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

export { API_URL, SITE_URL };
export default axios;

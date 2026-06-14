import axios from "axios";
import API_URL from "./config/api";

// Set axios default base URL so all relative paths are prefixed
axios.defaults.baseURL = API_URL;

// Also rewrite any absolute localhost URLs used directly in fetch calls
const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");
const LOCAL_API_URL = "http://localhost:5000";

function rewriteApiUrl(url) {
  if (typeof url !== "string" || !url.startsWith(LOCAL_API_URL)) {
    return url;
  }
  return `${API_URL}${url.slice(LOCAL_API_URL.length)}`;
}

// Intercept all axios requests to rewrite any absolute localhost URLs
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith(LOCAL_API_URL)) {
    config.url = `${API_URL}${config.url.slice(LOCAL_API_URL.length)}`;
  }
  return config;
});

// Override window.fetch to rewrite localhost URLs at runtime
if (typeof window !== "undefined" && !window.__apiUrlRewriterInstalled) {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === "string") {
      return nativeFetch(rewriteApiUrl(input), init);
    }
    if (input instanceof URL) {
      return nativeFetch(rewriteApiUrl(input.toString()), init);
    }
    return nativeFetch(input, init);
  };

  window.__apiUrlRewriterInstalled = true;
}

export { API_URL, SITE_URL };
export default axios;

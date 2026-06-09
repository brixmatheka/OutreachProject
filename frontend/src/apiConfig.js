import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:5173").replace(/\/+$/, "");

const LOCAL_API_URL = "http://localhost:5000";

function rewriteApiUrl(url) {
  if (typeof url !== "string" || !url.startsWith(LOCAL_API_URL)) {
    return url;
  }

  return `${API_URL}${url.slice(LOCAL_API_URL.length)}`;
}

axios.interceptors.request.use((config) => {
  if (config.url) {
    config.url = rewriteApiUrl(config.url);
  }

  return config;
});

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

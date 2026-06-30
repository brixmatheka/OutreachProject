const getDefaultApiUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";
  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

const API_URL = (import.meta.env.VITE_API_URL || getDefaultApiUrl()).replace(/\/+$/, "");
export default API_URL;

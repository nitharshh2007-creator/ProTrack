import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force-logout when the auth middleware itself rejects the token
    // (i.e. the request was to an /auth/ endpoint, or the server explicitly
    // signals an invalid/expired token via the message field).
    // Never wipe the session on a 401 from a business-logic check — that
    // would cause a redirect loop when background requests fail for reasons
    // other than an expired JWT (e.g. missing workspaceId on old tokens
    // resolved by a DB fallback, or unrelated access-control checks).
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? "";
      const isAuthEndpoint = url.includes("/auth/");

      if (isAuthEndpoint) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

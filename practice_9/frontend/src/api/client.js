import axios from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasTokens,
  setTokens,
} from "../auth/token";

export const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

let refreshRequest = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url === "/api/auth/refresh" ||
      !hasTokens()
    ) {
      if (status === 401) {
        clearTokens();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = api.post(
          "/api/auth/refresh",
          {},
          {
            headers: {
              "x-refresh-token": getRefreshToken(),
            },
          }
        );
      }

      const { data } = await refreshRequest;
      setTokens(data);
      refreshRequest = null;

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshRequest = null;
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);

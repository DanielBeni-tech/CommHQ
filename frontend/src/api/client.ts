import axios from "axios";

import { useAuthStore } from "@/stores/authStore";

/**
 * URL racine du serveur backend (sans `/api`).
 * Le préfixe `/api` est ajouté dans `baseURL` ci-dessous car le backend
 * NestJS expose toutes ses routes REST sous ce préfixe (cf. `main.ts`).
 */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: `${API_URL.replace(/\/$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

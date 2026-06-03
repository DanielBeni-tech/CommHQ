import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    setAuth,
    logout,
  };
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  activeWorkspaceId: string | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setActiveWorkspace: (id: string | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "dark",
      activeWorkspaceId: null,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setActiveWorkspace: (activeWorkspaceId) => set({ activeWorkspaceId }),
    }),
    { name: "syntra-ui" }
  )
);

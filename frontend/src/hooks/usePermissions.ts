import { useWorkspaces } from "@/hooks/useWorkspaces";

/** Droits dérivés du rôle de l'utilisateur dans l'espace de travail actif. */
export function usePermissions() {
  const { activeWorkspace } = useWorkspaces();
  const isModerator = activeWorkspace?.myRole === "moderator";

  return {
    role: activeWorkspace?.myRole ?? null,
    isModerator,
    canManageChannels: isModerator,
    canPinMessages: isModerator,
    canInvite: isModerator,
  };
}

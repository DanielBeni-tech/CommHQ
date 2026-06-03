import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createWorkspace, getWorkspaces } from "@/api/services";
import { useUiStore } from "@/stores/uiStore";

export function useWorkspaces() {
  const query = useQuery({ queryKey: ["workspaces"], queryFn: getWorkspaces });
  const activeWorkspaceId = useUiStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useUiStore((s) => s.setActiveWorkspace);

  useEffect(() => {
    if (!query.data?.length) return;
    const exists = query.data.some((w) => w.id === activeWorkspaceId);
    if (!activeWorkspaceId || !exists) {
      setActiveWorkspace(query.data[0].id);
    }
  }, [query.data, activeWorkspaceId, setActiveWorkspace]);

  const activeWorkspace =
    query.data?.find((w) => w.id === activeWorkspaceId) ?? null;

  return { ...query, activeWorkspace, activeWorkspaceId, setActiveWorkspace };
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const setActiveWorkspace = useUiStore((s) => s.setActiveWorkspace);
  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setActiveWorkspace(workspace.id);
    },
  });
}

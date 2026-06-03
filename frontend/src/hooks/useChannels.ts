import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createChannel,
  deleteChannel,
  getChannels,
  renameChannel,
} from "@/api/services";

export function useChannels(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ["channels", workspaceId],
    queryFn: () => getChannels(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateChannel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; isPrivate?: boolean }) =>
      createChannel({ workspaceId, ...input }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] }),
  });
}

export function useRenameChannel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, name }: { channelId: string; name: string }) =>
      renameChannel(channelId, name),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] }),
  });
}

export function useDeleteChannel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => deleteChannel(channelId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] }),
  });
}

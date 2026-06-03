import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
  setPinned,
} from "@/api/services";
import { realtime } from "@/realtime/client";
import type { Message } from "@/types";

const key = (channelId: string) => ["messages", channelId];

export function useMessages(channelId: string | undefined) {
  return useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => getMessages(channelId as string),
    enabled: Boolean(channelId),
  });
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(channelId, content),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(key(channelId), (prev = []) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message]
      );
      realtime.publish({ type: "message:new", payload: message });
    },
  });
}

export function useEditMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      editMessage(messageId, content),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(key(channelId), (prev = []) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
      realtime.publish({ type: "message:update", payload: message });
    },
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: (_data, messageId) => {
      queryClient.setQueryData<Message[]>(key(channelId), (prev = []) =>
        prev.filter((m) => m.id !== messageId)
      );
      realtime.publish({ type: "message:delete", payload: { channelId, messageId } });
    },
  });
}

export function useTogglePin(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
      setPinned(messageId, pinned),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(key(channelId), (prev = []) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
      realtime.publish({ type: "message:update", payload: message });
    },
  });
}

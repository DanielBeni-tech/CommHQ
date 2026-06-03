import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { realtime } from "@/realtime/client";
import { useAuth } from "@/hooks/useAuth";
import type { Message, RealtimeEvent, User } from "@/types";

const TYPING_TIMEOUT = 4000;

export function useChannelRealtime(channelId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!channelId) return;
    realtime.joinChannel(channelId);
    setTypingUsers([]);

    const off = realtime.on((event: RealtimeEvent) => {
      switch (event.type) {
        case "message:new": {
          if (event.payload.channelId !== channelId) return;
          queryClient.setQueryData<Message[]>(["messages", channelId], (prev = []) =>
            prev.some((m) => m.id === event.payload.id)
              ? prev
              : [...prev, event.payload]
          );
          break;
        }
        case "message:update": {
          if (event.payload.channelId !== channelId) return;
          queryClient.setQueryData<Message[]>(["messages", channelId], (prev = []) =>
            prev.map((m) => (m.id === event.payload.id ? event.payload : m))
          );
          break;
        }
        case "message:delete": {
          if (event.payload.channelId !== channelId) return;
          queryClient.setQueryData<Message[]>(["messages", channelId], (prev = []) =>
            prev.filter((m) => m.id !== event.payload.messageId)
          );
          break;
        }
        case "typing": {
          const { user: typer, isTyping, channelId: ch } = event.payload;
          if (ch !== channelId || typer.id === user?.id) return;
          setTypingUsers((prev) => {
            const others = prev.filter((u) => u.id !== typer.id);
            return isTyping ? [...others, typer] : others;
          });
          clearTimeout(timers.current[typer.id]);
          if (isTyping) {
            timers.current[typer.id] = setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u.id !== typer.id));
            }, TYPING_TIMEOUT);
          }
          break;
        }
      }
    });

    return () => {
      off();
      realtime.leaveChannel(channelId);
    };
  }, [channelId, queryClient, user?.id]);

  function notifyTyping(isTyping: boolean) {
    if (channelId && user) realtime.setTyping(channelId, isTyping, user);
  }

  return { typingUsers, notifyTyping };
}

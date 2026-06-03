import { io, type Socket } from "socket.io-client";

import type { RealtimeEvent, User } from "@/types";

type Handler = (event: RealtimeEvent) => void;

export interface RealtimeClient {
  connect(token: string | null): void;
  disconnect(): void;
  joinChannel(channelId: string): void;
  leaveChannel(channelId: string): void;
  /** Diffuse un évènement (utilisé en mode mock pour simuler le serveur). */
  publish(event: RealtimeEvent): void;
  setTyping(channelId: string, isTyping: boolean, user: User): void;
  on(handler: Handler): () => void;
}

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:3000";

/**
 * Implémentation mock : utilise BroadcastChannel pour une synchronisation
 * temps réel réelle entre les onglets du même navigateur (démo sans backend).
 */
class MockRealtimeClient implements RealtimeClient {
  private channel: BroadcastChannel | null = null;
  private handlers = new Set<Handler>();

  connect() {
    if (this.channel) return;
    this.channel = new BroadcastChannel("commhq-realtime");
    this.channel.onmessage = (e: MessageEvent<RealtimeEvent>) => {
      this.handlers.forEach((h) => h(e.data));
    };
  }

  disconnect() {
    this.channel?.close();
    this.channel = null;
    this.handlers.clear();
  }

  joinChannel() {}
  leaveChannel() {}

  publish(event: RealtimeEvent) {
    this.channel?.postMessage(event);
  }

  setTyping(channelId: string, isTyping: boolean, user: User) {
    this.publish({ type: "typing", payload: { channelId, user, isTyping } });
  }

  on(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

/** Implémentation Socket.IO pour le backend NestJS réel. */
class SocketRealtimeClient implements RealtimeClient {
  private socket: Socket | null = null;
  private handlers = new Set<Handler>();

  connect(token: string | null) {
    if (this.socket) return;
    this.socket = io(WS_URL, {
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      autoConnect: true,
    });
    const forward = (type: RealtimeEvent["type"]) =>
      this.socket?.on(type, (payload: unknown) =>
        this.handlers.forEach((h) => h({ type, payload } as RealtimeEvent))
      );
    forward("message:new");
    forward("message:update");
    forward("message:delete");
    forward("typing");
    forward("presence:update");
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.handlers.clear();
  }

  joinChannel(channelId: string) {
    this.socket?.emit("channel:join", { channelId });
  }

  leaveChannel(channelId: string) {
    this.socket?.emit("channel:leave", { channelId });
  }

  publish() {
    /* Avec un vrai backend, le serveur diffuse les évènements. */
  }

  setTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit("typing", { channelId, isTyping });
  }

  on(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const realtime: RealtimeClient = USE_MOCKS
  ? new MockRealtimeClient()
  : new SocketRealtimeClient();

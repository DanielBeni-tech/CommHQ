import { io, type Socket } from "socket.io-client";

import { __internal } from "@/api/services";
import type { Message, RealtimeEvent, User } from "@/types";

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
    this.channel = new BroadcastChannel("syntra-realtime");
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

/**
 * Implémentation Socket.IO pour le backend NestJS réel.
 *
 * Particularités d'alignement :
 *  - Le backend expose la passerelle dans le namespace `/realtime`.
 *  - Les évènements messages sont nommés `message:new` / `message:updated` /
 *    `message:deleted` côté serveur. On les retraduit ici dans le format
 *    domaine du frontend (`message:new`, `message:update`, `message:delete`).
 *  - Le payload `typing` du serveur fournit `{ channelId, userId, userName, isTyping }`
 *    sans objet User complet : on reconstitue un objet `User` minimal.
 */
class SocketRealtimeClient implements RealtimeClient {
  private socket: Socket | null = null;
  private handlers = new Set<Handler>();

  connect(token: string | null) {
    if (this.socket) return;
    this.socket = io(`${WS_URL.replace(/\/$/, "")}/realtime`, {
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("message:new", (raw: unknown) => {
      const message = __internal.mapMessage(raw as Parameters<typeof __internal.mapMessage>[0]);
      this.dispatch({ type: "message:new", payload: message });
    });

    this.socket.on("message:updated", (raw: unknown) => {
      const message = __internal.mapMessage(raw as Parameters<typeof __internal.mapMessage>[0]);
      this.dispatch({ type: "message:update", payload: message });
    });

    this.socket.on("message:deleted", (payload: { channelId: string; messageId: string }) => {
      this.dispatch({ type: "message:delete", payload });
    });

    this.socket.on(
      "typing",
      (payload: {
        channelId: string;
        userId: string;
        userName?: string;
        isTyping?: boolean;
      }) => {
        const user: User = {
          id: payload.userId,
          name: payload.userName ?? "Utilisateur",
          email: "",
          globalRole: "user",
        };
        this.dispatch({
          type: "typing",
          payload: {
            channelId: payload.channelId,
            user,
            isTyping: payload.isTyping !== false,
          },
        });
      },
    );
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
    // Sur le vrai backend, c'est le serveur qui diffuse les évènements ;
    // les mutations React Query mettent déjà à jour l'UI de l'émetteur
    // de manière optimiste. Inutile de redispatcher localement.
  }

  setTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit("typing", { channelId, isTyping });
  }

  on(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private dispatch(event: RealtimeEvent) {
    this.handlers.forEach((h) => h(event));
  }

  /** Lit l'état brut envoyé par le backend (utilisé pour les types narrows). */
  // (placeholder pour future extension — non utilisé pour l'instant)
}

export const realtime: RealtimeClient = USE_MOCKS
  ? new MockRealtimeClient()
  : new SocketRealtimeClient();

// Données utilitaires non typées : utilisé par mapMessage pour parser
// les payloads reçus en WebSocket. Identique à la fonction de services.ts.
export type { Message };

export type GlobalRole = "user" | "admin";
export type WorkspaceRole = "member" | "moderator";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  globalRole: GlobalRole;
  online?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  /** Rôle de l'utilisateur courant dans cet espace. */
  myRole: WorkspaceRole;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  isWelcome?: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: User;
  content: string;
  createdAt: string;
  editedAt?: string;
  pinned: boolean;
}

export interface ChannelSummary {
  channelId: string;
  summary: string;
  messageCount: number;
  generatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Invitation {
  token: string;
  workspaceId: string;
  workspaceName: string;
}

/** Évènements temps réel (alignés sur les évènements WebSocket du cahier des charges). */
export type RealtimeEvent =
  | { type: "message:new"; payload: Message }
  | { type: "message:update"; payload: Message }
  | { type: "message:delete"; payload: { channelId: string; messageId: string } }
  | { type: "typing"; payload: { channelId: string; user: User; isTyping: boolean } }
  | { type: "presence:update"; payload: { userId: string; online: boolean } };

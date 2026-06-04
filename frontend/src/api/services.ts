import { apiClient } from "@/api/client";
import type {
  AuthResponse,
  Channel,
  ChannelSummary,
  Invitation,
  Message,
  User,
  Workspace,
} from "@/types";

/* ============================================================
 * Couche d'adaptation API
 *
 * Les fonctions ci-dessous parlent au backend NestJS de CommHQ.
 * Le backend expose des payloads légèrement différents des types
 * « domaine » utilisés dans le frontend (héritage MSW). Plutôt que
 * de plier le frontend à la forme exacte du serveur, on mappe ici
 * les réponses pour conserver une UI propre et stable.
 * ============================================================ */

interface BackendAuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

interface BackendMessage {
  id: string;
  channelId: string;
  authorId: string;
  author?: { id: string; name: string; avatarUrl?: string };
  content: string;
  pinned: boolean;
  editedAt: string | null;
  createdAt: string;
}

interface BackendChannel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  type: "text";
  createdAt?: string;
}

interface BackendInvitationCreate {
  id: string;
  token: string;
  expiresAt: string;
  url: string;
  email: string | null;
}

interface BackendInvitationPreview {
  token: string;
  workspaceId: string;
  workspaceName: string;
  email: string | null;
  expiresAt: string;
}

interface BackendChannelSummary {
  id: string;
  channelId: string;
  sentences: string[];
  summary?: string;
  messageCount: number;
  modelUsed: string;
  createdAt: string;
}

function mapMessage(m: BackendMessage): Message {
  // Le backend embarque l'auteur dans `author` (id, name, avatarUrl).
  // S'il manque (réponse plus ancienne ou champ peuplé incomplet), on retombe
  // sur un placeholder pour ne pas casser le rendu.
  const author: User = m.author
    ? {
        id: m.author.id,
        name: m.author.name,
        email: "",
        avatarUrl: m.author.avatarUrl,
        globalRole: "user",
      }
    : { id: m.authorId, name: "Utilisateur", email: "", globalRole: "user" };
  return {
    id: m.id,
    channelId: m.channelId,
    author,
    content: m.content,
    pinned: m.pinned,
    createdAt: m.createdAt,
    editedAt: m.editedAt ?? undefined,
  };
}

function mapChannel(c: BackendChannel): Channel {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    name: c.name,
    description: c.description,
    isPrivate: c.isPrivate,
    isWelcome: c.name === "general",
    createdAt: c.createdAt ?? new Date().toISOString(),
  };
}

function mapAuth(a: BackendAuthResponse): AuthResponse {
  return { token: a.accessToken, user: a.user };
}

/* ----------------------------- Auth ----------------------------- */

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<BackendAuthResponse>("/auth/login", {
    email,
    password,
  });
  return mapAuth(data);
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  invitationToken?: string;
}) {
  const { data } = await apiClient.post<BackendAuthResponse>("/auth/register", input);
  return mapAuth(data);
}

export async function resolveInvitation(token: string): Promise<Invitation> {
  const { data } = await apiClient.get<BackendInvitationPreview>(
    `/invitations/${token}`,
  );
  return {
    token: data.token,
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName,
  };
}

/* -------------------------- Workspaces -------------------------- */

export async function getWorkspaces() {
  const { data } = await apiClient.get<Workspace[]>("/workspaces");
  return data;
}

export async function createWorkspace(name: string) {
  const { data } = await apiClient.post<Workspace>("/workspaces", { name });
  return data;
}

export async function createInvitation(workspaceId: string): Promise<Invitation> {
  const { data } = await apiClient.post<BackendInvitationCreate>(
    `/workspaces/${workspaceId}/invitations`,
  );
  // L'API de création ne renvoie pas `workspaceName` (info connue côté appelant).
  // On laisse le champ vide ; le composant InviteDialog n'en a pas besoin pour copier le lien.
  return {
    token: data.token,
    workspaceId,
    workspaceName: "",
  };
}

/* --------------------------- Channels --------------------------- */

export async function getChannels(workspaceId: string): Promise<Channel[]> {
  const { data } = await apiClient.get<BackendChannel[]>(
    `/workspaces/${workspaceId}/channels`,
  );
  return data.map(mapChannel);
}

export async function createChannel(input: {
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
}): Promise<Channel> {
  const { workspaceId, ...body } = input;
  const { data } = await apiClient.post<BackendChannel>(
    `/workspaces/${workspaceId}/channels`,
    body,
  );
  return mapChannel(data);
}

export async function renameChannel(channelId: string, name: string): Promise<Channel> {
  const { data } = await apiClient.patch<BackendChannel>(`/channels/${channelId}`, {
    name,
  });
  return mapChannel(data);
}

export async function deleteChannel(channelId: string) {
  await apiClient.delete(`/channels/${channelId}`);
}

/* --------------------------- Messages --------------------------- */

export async function getMessages(channelId: string): Promise<Message[]> {
  const { data } = await apiClient.get<BackendMessage[]>(
    `/channels/${channelId}/messages`,
  );
  return data.map(mapMessage);
}

export async function sendMessage(channelId: string, content: string): Promise<Message> {
  const { data } = await apiClient.post<BackendMessage>(
    `/channels/${channelId}/messages`,
    { content },
  );
  return mapMessage(data);
}

export async function editMessage(messageId: string, content: string): Promise<Message> {
  const { data } = await apiClient.patch<BackendMessage>(`/messages/${messageId}`, {
    content,
  });
  return mapMessage(data);
}

export async function deleteMessage(messageId: string) {
  await apiClient.delete(`/messages/${messageId}`);
}

export async function setPinned(messageId: string, pinned: boolean): Promise<Message> {
  const { data } = await apiClient.post<BackendMessage>(
    `/messages/${messageId}/${pinned ? "pin" : "unpin"}`,
  );
  return mapMessage(data);
}

/* ----------------------------- IA ------------------------------- */

export async function summarizeChannel(channelId: string): Promise<ChannelSummary> {
  const { data } = await apiClient.post<BackendChannelSummary>(
    `/channels/${channelId}/summary`,
  );
  return {
    channelId: data.channelId,
    summary: data.summary ?? data.sentences.join(" "),
    messageCount: data.messageCount,
    generatedAt: data.createdAt,
  };
}

/* --------------------------- Internal --------------------------- */
// Exporté pour permettre au realtime client d'utiliser la même fonction
// de mapping lors de la réception d'évènements WebSocket.
export const __internal = { mapMessage, mapChannel };

import { apiClient } from "@/api/client";
import type {
  AuthResponse,
  Channel,
  ChannelSummary,
  Invitation,
  Message,
  Workspace,
} from "@/types";

/* ----------------------------- Auth ----------------------------- */

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  invitationToken?: string;
}) {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", input);
  return data;
}

export async function resolveInvitation(token: string) {
  const { data } = await apiClient.get<Invitation>(`/invitations/${token}`);
  return data;
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

export async function createInvitation(workspaceId: string) {
  const { data } = await apiClient.post<Invitation>(
    `/workspaces/${workspaceId}/invitations`
  );
  return data;
}

/* --------------------------- Channels --------------------------- */

export async function getChannels(workspaceId: string) {
  const { data } = await apiClient.get<Channel[]>(
    `/workspaces/${workspaceId}/channels`
  );
  return data;
}

export async function createChannel(input: {
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
}) {
  const { workspaceId, ...body } = input;
  const { data } = await apiClient.post<Channel>(
    `/workspaces/${workspaceId}/channels`,
    body
  );
  return data;
}

export async function renameChannel(channelId: string, name: string) {
  const { data } = await apiClient.patch<Channel>(`/channels/${channelId}`, {
    name,
  });
  return data;
}

export async function deleteChannel(channelId: string) {
  await apiClient.delete(`/channels/${channelId}`);
}

/* --------------------------- Messages --------------------------- */

export async function getMessages(channelId: string) {
  const { data } = await apiClient.get<Message[]>(
    `/channels/${channelId}/messages`
  );
  return data;
}

export async function sendMessage(channelId: string, content: string) {
  const { data } = await apiClient.post<Message>(
    `/channels/${channelId}/messages`,
    { content }
  );
  return data;
}

export async function editMessage(messageId: string, content: string) {
  const { data } = await apiClient.patch<Message>(`/messages/${messageId}`, {
    content,
  });
  return data;
}

export async function deleteMessage(messageId: string) {
  await apiClient.delete(`/messages/${messageId}`);
}

export async function setPinned(messageId: string, pinned: boolean) {
  const { data } = await apiClient.post<Message>(
    `/messages/${messageId}/${pinned ? "pin" : "unpin"}`
  );
  return data;
}

/* ----------------------------- IA ------------------------------- */

export async function summarizeChannel(channelId: string) {
  const { data } = await apiClient.post<ChannelSummary>(
    `/channels/${channelId}/summary`
  );
  return data;
}

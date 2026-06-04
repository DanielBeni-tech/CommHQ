import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    globalRole: string;
  };
}

/**
 * Petit DSL au-dessus de supertest pour rendre les tests lisibles.
 *
 * Chaque méthode renvoie la réponse complète de supertest afin que la suite
 * puisse asserter sur le statut, le body, etc.
 */
export class ApiClient {
  constructor(
    private readonly app: INestApplication,
    public readonly token?: string,
  ) {}

  withToken(token: string): ApiClient {
    return new ApiClient(this.app, token);
  }

  // ─── Auth ────────────────────────────────────────────────────────────

  register(payload: {
    name: string;
    email: string;
    password: string;
    invitationToken?: string;
  }) {
    return this.post('/api/auth/register', payload);
  }

  login(payload: { email: string; password: string }) {
    return this.post('/api/auth/login', payload);
  }

  /**
   * Crée un compte ET renvoie une session prête à l'emploi.
   * Pratique pour les setups de tests.
   */
  async signUp(payload: {
    name: string;
    email: string;
    password: string;
    invitationToken?: string;
  }): Promise<AuthSession> {
    const response = await this.register(payload).expect(201);
    return response.body as AuthSession;
  }

  // ─── Users ───────────────────────────────────────────────────────────

  getMe() {
    return this.get('/api/users/me');
  }

  // ─── Workspaces ──────────────────────────────────────────────────────

  createWorkspace(payload: { name: string; description?: string }) {
    return this.post('/api/workspaces', payload);
  }

  listWorkspaces() {
    return this.get('/api/workspaces');
  }

  getWorkspace(id: string) {
    return this.get(`/api/workspaces/${id}`);
  }

  // ─── Channels ────────────────────────────────────────────────────────

  createChannel(
    workspaceId: string,
    payload: { name: string; description?: string; isPrivate?: boolean },
  ) {
    return this.post(`/api/workspaces/${workspaceId}/channels`, payload);
  }

  listChannels(workspaceId: string) {
    return this.get(`/api/workspaces/${workspaceId}/channels`);
  }

  // ─── Messages ────────────────────────────────────────────────────────

  sendMessage(channelId: string, content: string) {
    return this.post(`/api/channels/${channelId}/messages`, { content });
  }

  listMessages(
    channelId: string,
    options: { before?: string; limit?: number; pinned?: boolean } = {},
  ) {
    const params: string[] = [];
    if (options.before) params.push(`before=${encodeURIComponent(options.before)}`);
    if (options.limit) params.push(`limit=${options.limit}`);
    if (options.pinned) params.push(`pinned=true`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.get(`/api/channels/${channelId}/messages${query}`);
  }

  editMessage(messageId: string, content: string) {
    return this.patch(`/api/messages/${messageId}`, { content });
  }

  deleteMessage(messageId: string) {
    return this.delete(`/api/messages/${messageId}`);
  }

  pinMessage(messageId: string) {
    return this.post(`/api/messages/${messageId}/pin`);
  }

  unpinMessage(messageId: string) {
    return this.post(`/api/messages/${messageId}/unpin`);
  }

  // ─── Direct messages ─────────────────────────────────────────────────

  sendDirectMessage(payload: { toUserId: string; content: string }) {
    return this.post('/api/direct-messages', payload);
  }

  listDirectConversations() {
    return this.get('/api/direct-messages');
  }

  conversation(otherUserId: string) {
    return this.get(`/api/direct-messages/${otherUserId}`);
  }

  // ─── Invitations ─────────────────────────────────────────────────────

  createInvitation(workspaceId: string, payload: { email?: string } = {}) {
    return this.post(`/api/workspaces/${workspaceId}/invitations`, payload);
  }

  previewInvitation(token: string) {
    return this.get(`/api/invitations/${token}`);
  }

  // ─── AI Summary ──────────────────────────────────────────────────────

  generateSummary(channelId: string) {
    return this.post(`/api/channels/${channelId}/summary`);
  }

  listSummaries(channelId: string) {
    return this.get(`/api/channels/${channelId}/summary`);
  }

  // ─── Health ──────────────────────────────────────────────────────────

  health() {
    return request(this.app.getHttpServer()).get('/health');
  }

  // ─── Bas-niveau : helpers HTTP avec/sans token ───────────────────────

  private get(url: string) {
    const req = request(this.app.getHttpServer()).get(url);
    return this.token ? req.set('Authorization', `Bearer ${this.token}`) : req;
  }

  private post(url: string, body?: unknown) {
    const req = request(this.app.getHttpServer()).post(url).send(body ?? {});
    return this.token ? req.set('Authorization', `Bearer ${this.token}`) : req;
  }

  private patch(url: string, body?: unknown) {
    const req = request(this.app.getHttpServer()).patch(url).send(body ?? {});
    return this.token ? req.set('Authorization', `Bearer ${this.token}`) : req;
  }

  private delete(url: string) {
    const req = request(this.app.getHttpServer()).delete(url);
    return this.token ? req.set('Authorization', `Bearer ${this.token}`) : req;
  }
}

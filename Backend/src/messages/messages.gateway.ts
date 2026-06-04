import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { MessagesService, PublicMessage } from './messages.service';
import { ChannelsService } from '../channels/channels.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

/**
 * Passerelle WebSocket centrale de CommHQ.
 *
 * Mode :
 *   - Le frontend ouvre une connexion Socket.IO en envoyant son JWT
 *     dans `auth.token` lors du handshake.
 *   - Une connexion sans token valide est rejetée immédiatement.
 *   - Les canaux sont implémentés via des "rooms" Socket.IO (`channel:<id>`).
 *
 * Événements client → serveur :
 *   - 'channel:join'   { channelId }           → rejoint la room
 *   - 'channel:leave'  { channelId }           → quitte la room
 *   - 'message:send'   { channelId, content }  → publie un message
 *   - 'typing'         { channelId }           → indicateur de frappe
 *
 * Événements serveur → clients :
 *   - 'message:new'      <PublicMessage>
 *   - 'message:updated'  <PublicMessage>
 *   - 'message:deleted'  { channelId, messageId }
 *   - 'typing'           { channelId, userId, userName, isTyping }
 *   - 'summary:new'      <Summary>   (publié par AiSummaryService)
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*', credentials: true },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagesGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly channelsService: ChannelsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * À la connexion, on vérifie le JWT fourni dans le handshake
   * et on stocke l'identité de l'utilisateur sur le socket.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        this.extractBearerFromHeader(client.handshake.headers['authorization']);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // On attache les infos d'identité au socket pour les réutiliser sur chaque event.
      (client.data as Record<string, unknown>).userId = payload.sub;
      (client.data as Record<string, unknown>).email = payload.email;
      (client.data as Record<string, unknown>).userName = payload.name;

      this.logger.log(`Socket connecté : ${client.id} (user=${payload.sub})`);
    } catch (error) {
      this.logger.warn(`Connexion WS refusée : ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Socket déconnecté : ${client.id}`);
  }

  /**
   * Rejoint la room d'un canal après avoir vérifié les droits d'accès.
   */
  @SubscribeMessage('channel:join')
  async onJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ): Promise<{ ok: true }> {
    const userId = this.requireUserId(client);
    await this.channelsService.ensureAccess(body.channelId, userId);

    const room = this.channelRoom(body.channelId);
    await client.join(room);
    return { ok: true };
  }

  @SubscribeMessage('channel:leave')
  async onLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ): Promise<{ ok: true }> {
    await client.leave(this.channelRoom(body.channelId));
    return { ok: true };
  }

  /**
   * Envoi d'un message via WebSocket — la voie « rapide » (latence < 300 ms visée).
   * Le message est sauvegardé puis rediffusé à tous les clients de la room.
   */
  @SubscribeMessage('message:send')
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; content: string },
  ): Promise<PublicMessage> {
    const userId = this.requireUserId(client);
    if (!body?.channelId || !body?.content) {
      throw new WsException('Paramètres invalides.');
    }

    const message = await this.messagesService.create(
      body.channelId,
      userId,
      body.content,
    );
    this.broadcastNewMessage(message);
    return message;
  }

  /**
   * Indicateur "est en train d'écrire" — non persisté.
   * On rediffuse `userName` (issu du JWT) pour que les autres clients puissent
   * afficher "Camille est en train d'écrire…" sans requête additionnelle.
   */
  @SubscribeMessage('typing')
  onTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; isTyping?: boolean },
  ): void {
    const userId = this.requireUserId(client);
    const userName = (client.data as { userName?: string }).userName ?? 'Utilisateur';
    client.to(this.channelRoom(body.channelId)).emit('typing', {
      channelId: body.channelId,
      userId,
      userName,
      isTyping: body.isTyping !== false,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // API interne — appelée par les contrôleurs / services
  // ─────────────────────────────────────────────────────────────

  /**
   * Diffuse un nouveau message à tous les sockets connectés au canal.
   * Utilisé à la fois par WebSocket et par REST (pour la cohérence).
   */
  broadcastNewMessage(message: PublicMessage): void {
    this.server.to(this.channelRoom(message.channelId)).emit('message:new', message);
  }

  broadcastUpdatedMessage(message: PublicMessage): void {
    this.server.to(this.channelRoom(message.channelId)).emit('message:updated', message);
  }

  /**
   * Diffuse une suppression de message uniquement aux sockets du canal concerné.
   */
  broadcastDeletedMessage(channelId: string, messageId: string): void {
    this.server.to(this.channelRoom(channelId)).emit('message:deleted', {
      channelId,
      messageId,
    });
  }

  /**
   * Utilisé par AiSummaryService pour pousser un résumé au canal.
   */
  broadcastSummary(channelId: string, summaryPayload: unknown): void {
    this.server.to(this.channelRoom(channelId)).emit('summary:new', summaryPayload);
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  private channelRoom(channelId: string): string {
    return `channel:${channelId}`;
  }

  private requireUserId(client: Socket): string {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId) {
      throw new WsException('Non authentifié.');
    }
    return userId;
  }

  private extractBearerFromHeader(header: string | string[] | undefined): string | undefined {
    if (!header) return undefined;
    const value = Array.isArray(header) ? header[0] : header;
    return value.toLowerCase().startsWith('bearer ') ? value.slice(7).trim() : undefined;
  }
}

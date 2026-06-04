import { io, Socket } from 'socket.io-client';
import { TestAppHandle, createTestApp } from './utils/test-app';
import { ApiClient, AuthSession } from './utils/api-client';

/**
 * Tests end-to-end de la passerelle WebSocket Socket.IO (`/realtime`).
 *
 * On vérifie :
 *  - Le rejet d'une connexion sans JWT.
 *  - Le rejet d'une connexion avec un JWT invalide.
 *  - Une connexion authentifiée + join d'un canal + diffusion de messages.
 *  - L'envoi via `message:send` (voie rapide WebSocket).
 *  - L'évènement `summary:new` diffusé après génération d'un résumé IA.
 */
describe('CommHQ Realtime / Socket.IO (e2e)', () => {
  let handle: TestAppHandle;
  let anonymousClient: ApiClient;

  beforeAll(async () => {
    handle = await createTestApp();
    anonymousClient = new ApiClient(handle.app);
  });

  afterAll(async () => {
    await handle?.close();
  });

  /**
   * Helper : ouvre un socket sur le namespace /realtime.
   *
   * Selon la stratégie de rejet utilisée par la passerelle, on peut recevoir :
   *   - `connect_error` si un middleware Socket.IO rejette le handshake ;
   *   - `connect` puis immédiatement `disconnect` si le serveur ferme la
   *     connexion depuis `handleConnection`.
   *
   * Notre passerelle CommHQ utilise `client.disconnect(true)` → on traite
   * une déconnexion immédiate (< 1s) après `connect` comme un refus.
   */
  function openSocket(token?: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = io(`${handle.baseUrl}/realtime`, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
        auth: token ? { token } : {},
      });

      let connected = false;
      const onConnectError = (err: Error) => {
        socket.close();
        reject(err);
      };
      socket.once('connect_error', onConnectError);
      socket.once('connect', () => {
        connected = true;
        // Si le serveur nous coupe juste après, on considère la connexion refusée.
        const disconnectGuard = setTimeout(() => {
          socket.off('disconnect', onEarlyDisconnect);
          resolve(socket);
        }, 250);
        const onEarlyDisconnect = (reason: string) => {
          clearTimeout(disconnectGuard);
          socket.close();
          reject(new Error(`Connexion refusée par le serveur (${reason})`));
        };
        socket.once('disconnect', onEarlyDisconnect);
      });
      socket.once('disconnect', () => {
        if (!connected) {
          // Cas où on est déconnecté avant même de recevoir `connect`.
          socket.close();
          reject(new Error('Connexion refusée avant le handshake'));
        }
      });
    });
  }

  /**
   * Attend qu'un évènement Socket.IO arrive (avec timeout).
   */
  function waitForEvent<T>(
    socket: Socket,
    eventName: string,
    timeoutMs = 5000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout en attendant l'évènement ${eventName}`));
      }, timeoutMs);
      socket.once(eventName, (payload: T) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  // Setup partagé : un workspace + canal + 2 utilisateurs
  let alice: AuthSession;
  let bob: AuthSession;
  let aliceClient: ApiClient;
  let workspaceId: string;
  let channelId: string;

  beforeAll(async () => {
    alice = await anonymousClient.signUp({
      name: 'Alice WS',
      email: 'alice-ws@example.com',
      password: 'Password123',
    });
    aliceClient = new ApiClient(handle.app, alice.accessToken);

    const ws = await aliceClient.createWorkspace({ name: 'WS Realtime' });
    workspaceId = ws.body.id as string;

    const channels = await aliceClient.listChannels(workspaceId);
    channelId = channels.body[0].id as string;

    // Bob rejoint via une invitation pour être membre du même workspace.
    const invite = await aliceClient.createInvitation(workspaceId);
    bob = await anonymousClient.signUp({
      name: 'Bob WS',
      email: 'bob-ws@example.com',
      password: 'Password123',
      invitationToken: invite.body.token as string,
    });
  });

  it('refuse une connexion WS sans token', async () => {
    await expect(openSocket()).rejects.toBeDefined();
  });

  it('refuse une connexion WS avec un token invalide', async () => {
    await expect(openSocket('not-a-valid-jwt')).rejects.toBeDefined();
  });

  it('accepte une connexion authentifiée', async () => {
    const socket = await openSocket(alice.accessToken);
    expect(socket.connected).toBe(true);
    socket.close();
  });

  it("diffuse 'message:new' à tous les sockets joints au canal", async () => {
    const aliceSocket = await openSocket(alice.accessToken);
    const bobSocket = await openSocket(bob.accessToken);

    try {
      // Les deux sockets rejoignent la room du canal.
      await new Promise((resolve) =>
        aliceSocket.emit('channel:join', { channelId }, resolve),
      );
      await new Promise((resolve) =>
        bobSocket.emit('channel:join', { channelId }, resolve),
      );

      // Bob écoute le prochain `message:new`.
      const incoming = waitForEvent<{ id: string; content: string; channelId: string }>(
        bobSocket,
        'message:new',
      );

      // Alice envoie un message via REST → la passerelle doit broadcaster.
      const sent = await aliceClient.sendMessage(channelId, 'Hello via REST');
      expect(sent.status).toBe(201);

      const received = await incoming;
      expect(received.channelId).toBe(channelId);
      expect(received.content).toBe('Hello via REST');
    } finally {
      aliceSocket.close();
      bobSocket.close();
    }
  });

  it("envoi via 'message:send' (voie WebSocket rapide)", async () => {
    const aliceSocket = await openSocket(alice.accessToken);
    const bobSocket = await openSocket(bob.accessToken);

    try {
      await new Promise((resolve) =>
        aliceSocket.emit('channel:join', { channelId }, resolve),
      );
      await new Promise((resolve) =>
        bobSocket.emit('channel:join', { channelId }, resolve),
      );

      const incoming = waitForEvent<{ content: string }>(bobSocket, 'message:new');

      // Alice envoie via le canal WS.
      const ack = await new Promise<{ id: string; content: string }>((resolve) => {
        aliceSocket.emit(
          'message:send',
          { channelId, content: 'Hello via WS' },
          (response: { id: string; content: string }) => resolve(response),
        );
      });
      expect(ack.content).toBe('Hello via WS');

      const received = await incoming;
      expect(received.content).toBe('Hello via WS');
    } finally {
      aliceSocket.close();
      bobSocket.close();
    }
  });

  it("diffuse 'summary:new' à la génération d'un résumé IA", async () => {
    const aliceSocket = await openSocket(alice.accessToken);

    try {
      await new Promise((resolve) =>
        aliceSocket.emit('channel:join', { channelId }, resolve),
      );

      // On s'assure qu'il y a au moins un message dans le canal.
      await aliceClient.sendMessage(channelId, 'Décision : on garde Mongo.');

      const incoming = waitForEvent<{ sentences: string[]; channelId: string }>(
        aliceSocket,
        'summary:new',
        15000,
      );

      const summaryResp = await aliceClient.generateSummary(channelId);
      expect(summaryResp.status).toBe(201);

      const received = await incoming;
      expect(received.channelId).toBe(channelId);
      expect(received.sentences).toHaveLength(3);
    } finally {
      aliceSocket.close();
    }
  });
});

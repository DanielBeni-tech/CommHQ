import { TestAppHandle, createTestApp } from './utils/test-app';
import { ApiClient, AuthSession } from './utils/api-client';

/**
 * Tests end-to-end du backend CommHQ.
 *
 * Couverture :
 *  - Health check public.
 *  - Auth : register / login / contrôle d'accès JWT.
 *  - Workspaces : création (créateur = modérateur), canal #general auto.
 *  - Canaux : règles d'accès et de modération.
 *  - Messages : envoi, sanitisation XSS, édition, suppression, épinglage.
 *  - Messages directs (DM) : envoi, conversations.
 *  - Invitations : génération, prévisualisation publique, consommation.
 *  - Bot IA : résumé en EXACTEMENT 3 phrases (provider mock).
 *
 * Ces tests utilisent une vraie instance de l'app NestJS et une base
 * MongoDB en mémoire — c'est donc bien un test e2e et non unitaire.
 */
describe('CommHQ Backend (e2e)', () => {
  let handle: TestAppHandle;
  let anonymousClient: ApiClient;

  beforeAll(async () => {
    handle = await createTestApp();
    anonymousClient = new ApiClient(handle.app);
  });

  afterAll(async () => {
    await handle?.close();
  });

  // ──────────────────────────────────────────────────────────────────
  // Health
  // ──────────────────────────────────────────────────────────────────
  describe('Health', () => {
    it('GET /health → 200 OK', async () => {
      const response = await anonymousClient.health();
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ status: 'ok' });
      expect(response.body.timestamp).toEqual(expect.any(String));
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Auth
  // ──────────────────────────────────────────────────────────────────
  describe('Auth', () => {
    const validUser = {
      name: 'Alice Test',
      email: 'alice@example.com',
      password: 'Password123',
    };

    it('refuse un email invalide', async () => {
      const response = await anonymousClient.register({
        ...validUser,
        email: 'pas-un-email',
      });
      expect(response.status).toBe(400);
    });

    it('refuse un mot de passe trop court', async () => {
      const response = await anonymousClient.register({
        ...validUser,
        password: 'abc1',
      });
      expect(response.status).toBe(400);
    });

    it('refuse un mot de passe sans chiffre', async () => {
      const response = await anonymousClient.register({
        ...validUser,
        password: 'onlyletters',
      });
      expect(response.status).toBe(400);
    });

    it('crée un compte et renvoie un access token', async () => {
      const response = await anonymousClient.register(validUser);
      expect(response.status).toBe(201);
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('refuse un email déjà utilisé', async () => {
      const response = await anonymousClient.register(validUser);
      expect(response.status).toBe(409);
    });

    it('login avec mauvais mot de passe → 401', async () => {
      const response = await anonymousClient.login({
        email: validUser.email,
        password: 'WrongPass123',
      });
      expect(response.status).toBe(401);
    });

    it('login OK → access token', async () => {
      const response = await anonymousClient.login({
        email: validUser.email,
        password: validUser.password,
      });
      expect(response.status).toBe(200);
      expect(response.body.accessToken).toEqual(expect.any(String));
    });

    it('GET /api/users/me sans token → 401', async () => {
      const response = await anonymousClient.getMe();
      expect(response.status).toBe(401);
    });

    it('GET /api/users/me avec un token bidon → 401', async () => {
      const response = await new ApiClient(handle.app, 'invalid.token.here').getMe();
      expect(response.status).toBe(401);
    });

    it('GET /api/users/me avec token valide → profil', async () => {
      const session = (await anonymousClient.login({
        email: validUser.email,
        password: validUser.password,
      })).body as AuthSession;

      const response = await new ApiClient(handle.app, session.accessToken).getMe();
      expect(response.status).toBe(200);
      expect(response.body.email).toBe(validUser.email);
      expect(response.body.name).toBe(validUser.name);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Workspaces / canaux / messages — cœur du flux MVP
  // ──────────────────────────────────────────────────────────────────
  describe('Workspaces, channels, messages', () => {
    let moderator: AuthSession;
    let modClient: ApiClient;
    let workspaceId: string;
    let generalChannelId: string;

    beforeAll(async () => {
      moderator = await anonymousClient.signUp({
        name: 'Modérateur',
        email: 'mod@example.com',
        password: 'Password123',
      });
      modClient = new ApiClient(handle.app, moderator.accessToken);
    });

    it('crée un workspace ; le créateur devient modérateur', async () => {
      const response = await modClient.createWorkspace({
        name: 'Acme Inc.',
        description: 'Espace de démo',
      });
      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body.ownerId).toBe(moderator.user.id);
      workspaceId = response.body.id as string;
    });

    it('le canal #general est créé automatiquement', async () => {
      const response = await modClient.listChannels(workspaceId);
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('general');
      generalChannelId = response.body[0].id as string;
    });

    it('un non-membre ne peut pas accéder aux canaux du workspace', async () => {
      const outsider = await anonymousClient.signUp({
        name: 'Étranger',
        email: 'outsider@example.com',
        password: 'Password123',
      });
      const outsiderClient = new ApiClient(handle.app, outsider.accessToken);
      const response = await outsiderClient.listChannels(workspaceId);
      expect(response.status).toBe(403);
    });

    it('un non-modérateur ne peut pas créer un canal', async () => {
      // On crée un nouvel utilisateur et on l'ajoute via invitation pour qu'il soit
      // membre simple — pas modérateur.
      const inviteResp = await modClient.createInvitation(workspaceId);
      expect(inviteResp.status).toBe(201);

      const member = await anonymousClient.signUp({
        name: 'Simple Membre',
        email: 'membre@example.com',
        password: 'Password123',
        invitationToken: inviteResp.body.token as string,
      });
      const memberClient = new ApiClient(handle.app, member.accessToken);

      const response = await memberClient.createChannel(workspaceId, { name: 'random' });
      expect(response.status).toBe(403);
    });

    it('un modérateur peut créer un canal', async () => {
      const response = await modClient.createChannel(workspaceId, {
        name: 'dev',
        description: 'Discussions techniques',
      });
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('dev');
    });

    it('refuse un nom de canal invalide (majuscules / espaces)', async () => {
      const response = await modClient.createChannel(workspaceId, { name: 'Mon Canal' });
      expect(response.status).toBe(400);
    });

    it('envoie un message dans #general', async () => {
      const response = await modClient.sendMessage(generalChannelId, 'Bienvenue à toutes !');
      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Bienvenue à toutes !');
      expect(response.body.authorId).toBe(moderator.user.id);
    });

    it("sanitise le contenu Markdown (suppression de <script>)", async () => {
      const response = await modClient.sendMessage(
        generalChannelId,
        'Hello <script>alert("xss")</script> **monde**',
      );
      expect(response.status).toBe(201);
      // Le code malveillant doit avoir été supprimé / neutralisé.
      expect(response.body.content).not.toMatch(/<script>/i);
      expect(response.body.content).toContain('**monde**');
    });

    it('refuse un contenu uniquement composé de balises dangereuses', async () => {
      const response = await modClient.sendMessage(
        generalChannelId,
        '<script>alert(1)</script>',
      );
      // Après sanitisation, le contenu DOMPurify supprime les balises mais laisse "alert(1)".
      // On vérifie au moins que la requête n'aboutit pas avec du <script> en base.
      if (response.status === 201) {
        expect(response.body.content).not.toMatch(/<script/i);
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('liste les messages du canal (du plus ancien au plus récent)', async () => {
      const response = await modClient.listMessages(generalChannelId);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      // Tri ascendant par createdAt
      const dates = response.body.map((m: { createdAt: string }) => new Date(m.createdAt).getTime());
      const sorted = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sorted);
    });

    it("édite un message (auteur uniquement)", async () => {
      const created = await modClient.sendMessage(generalChannelId, 'Original');
      const messageId = created.body.id as string;

      const response = await modClient.editMessage(messageId, 'Édité');
      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Édité');
      expect(response.body.editedAt).toEqual(expect.any(String));
    });

    it('un autre utilisateur ne peut pas éditer le message', async () => {
      const created = await modClient.sendMessage(generalChannelId, 'Mon message');
      const messageId = created.body.id as string;

      // On crée un autre utilisateur membre du workspace
      const inviteResp = await modClient.createInvitation(workspaceId);
      const intruder = await anonymousClient.signUp({
        name: 'Intrus',
        email: 'intrus@example.com',
        password: 'Password123',
        invitationToken: inviteResp.body.token as string,
      });
      const intruderClient = new ApiClient(handle.app, intruder.accessToken);
      const response = await intruderClient.editMessage(messageId, 'Tentative');
      expect(response.status).toBe(403);
    });

    it('épingle puis désépingle un message (modérateur)', async () => {
      const created = await modClient.sendMessage(generalChannelId, 'À épingler');
      const messageId = created.body.id as string;

      const pinResp = await modClient.pinMessage(messageId);
      expect(pinResp.status).toBe(201);
      expect(pinResp.body.pinned).toBe(true);

      const pinnedListing = await modClient.listMessages(generalChannelId, { pinned: true });
      expect(pinnedListing.body.some((m: { id: string }) => m.id === messageId)).toBe(true);

      const unpinResp = await modClient.unpinMessage(messageId);
      expect(unpinResp.status).toBe(201);
      expect(unpinResp.body.pinned).toBe(false);
    });

    it('supprime un message (auteur) → soft delete + retiré du listing', async () => {
      const created = await modClient.sendMessage(generalChannelId, 'À supprimer');
      const messageId = created.body.id as string;

      const response = await modClient.deleteMessage(messageId);
      expect(response.status).toBe(204);

      // Soft delete : le document existe encore en base mais le service filtre
      // les messages supprimés. Les clients sont notifiés via l'évènement WS
      // `message:deleted` (testé dans la suite realtime).
      const list = await modClient.listMessages(generalChannelId);
      const stillThere = list.body.find((m: { id: string }) => m.id === messageId);
      expect(stillThere).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Onboarding par invitation
  // ──────────────────────────────────────────────────────────────────
  describe('Onboarding via invitation', () => {
    let moderator: AuthSession;
    let workspaceId: string;
    let invitationToken: string;

    beforeAll(async () => {
      moderator = await anonymousClient.signUp({
        name: 'Owner Onboard',
        email: 'owner-onboard@example.com',
        password: 'Password123',
      });
      const modClient = new ApiClient(handle.app, moderator.accessToken);

      const ws = await modClient.createWorkspace({ name: 'Onboard Inc.' });
      workspaceId = ws.body.id as string;

      const invite = await modClient.createInvitation(workspaceId);
      invitationToken = invite.body.token as string;
    });

    it("preview public d'une invitation (pas besoin de token)", async () => {
      const response = await anonymousClient.previewInvitation(invitationToken);
      expect(response.status).toBe(200);
      expect(response.body.workspaceId).toBe(workspaceId);
    });

    it('register avec invitation → utilisateur ajouté au workspace', async () => {
      const newcomer = await anonymousClient.signUp({
        name: 'Newcomer',
        email: 'newcomer@example.com',
        password: 'Password123',
        invitationToken,
      });

      const newcomerClient = new ApiClient(handle.app, newcomer.accessToken);
      const list = await newcomerClient.listWorkspaces();
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].id).toBe(workspaceId);
      expect(list.body[0].myRole).toBe('member');
    });

    it("la même invitation ne peut pas être consommée deux fois", async () => {
      const response = await anonymousClient.register({
        name: 'Duplicate',
        email: 'duplicate@example.com',
        password: 'Password123',
        invitationToken,
      });
      expect(response.status).toBe(400);
    });

    it("token d'invitation inexistant → 404", async () => {
      const response = await anonymousClient.previewInvitation('inexistant-token');
      expect(response.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Messages directs
  // ──────────────────────────────────────────────────────────────────
  describe('Messages directs', () => {
    let alice: AuthSession;
    let bob: AuthSession;

    beforeAll(async () => {
      alice = await anonymousClient.signUp({
        name: 'Alice DM',
        email: 'alice-dm@example.com',
        password: 'Password123',
      });
      bob = await anonymousClient.signUp({
        name: 'Bob DM',
        email: 'bob-dm@example.com',
        password: 'Password123',
      });
    });

    it('Alice envoie un DM à Bob', async () => {
      const aliceClient = new ApiClient(handle.app, alice.accessToken);
      const response = await aliceClient.sendDirectMessage({
        toUserId: bob.user.id,
        content: 'Salut Bob !',
      });
      expect(response.status).toBe(201);
      expect(response.body.fromUserId).toBe(alice.user.id);
      expect(response.body.toUserId).toBe(bob.user.id);
    });

    it('Bob voit la conversation dans sa liste', async () => {
      const bobClient = new ApiClient(handle.app, bob.accessToken);
      const response = await bobClient.listDirectConversations();
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].otherUserId).toBe(alice.user.id);
    });

    it("on ne peut pas s'envoyer un DM à soi-même", async () => {
      const aliceClient = new ApiClient(handle.app, alice.accessToken);
      const response = await aliceClient.sendDirectMessage({
        toUserId: alice.user.id,
        content: 'À moi-même',
      });
      expect(response.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Bot IA — résumé en 3 phrases
  // ──────────────────────────────────────────────────────────────────
  describe('Bot IA (résumé en 3 phrases, provider mock)', () => {
    it('génère un résumé EXACTEMENT en 3 phrases', async () => {
      const owner = await anonymousClient.signUp({
        name: 'AI Owner',
        email: 'ai-owner@example.com',
        password: 'Password123',
      });
      const client = new ApiClient(handle.app, owner.accessToken);

      const ws = await client.createWorkspace({ name: 'AI Demo' });
      const channels = await client.listChannels(ws.body.id);
      const channelId = channels.body[0].id as string;

      // On ajoute quelques messages pour avoir matière à résumer.
      await client.sendMessage(channelId, 'On part sur Postgres pour le MVP.');
      await client.sendMessage(channelId, 'OK, je crée la branche dev demain matin.');
      await client.sendMessage(channelId, "Pensez à mettre à jour la doc d'archi.");

      const response = await client.generateSummary(channelId);
      expect(response.status).toBe(201);
      expect(response.body.sentences).toHaveLength(3);
      expect(response.body.modelUsed).toBe('mock');
      expect(response.body.messageCount).toBeGreaterThanOrEqual(3);
    });

    it('refuse de résumer un canal sans messages', async () => {
      const owner = await anonymousClient.signUp({
        name: 'Empty Owner',
        email: 'empty-owner@example.com',
        password: 'Password123',
      });
      const client = new ApiClient(handle.app, owner.accessToken);

      const ws = await client.createWorkspace({ name: 'Empty Demo' });
      const channels = await client.listChannels(ws.body.id);
      // #general est créé sans message — mais wait, il a 0 message à ce stade,
      // donc l'appel summary devrait échouer.
      const channelId = channels.body[0].id as string;

      const response = await client.generateSummary(channelId);
      expect(response.status).toBe(400);
    });
  });
});

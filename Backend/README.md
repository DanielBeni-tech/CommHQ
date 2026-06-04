# CommHQ — Backend

Backend du projet **CommHQ** (chat technique sécurisé avec rendu Markdown / code et
bot IA de résumé). Implémente le cahier des charges du dossier
[`../Documentation/Cahier_des_charges.md`](../Documentation/Cahier_des_charges.md).

## Stack

- **NestJS** (Node.js + TypeScript) — REST + WebSocket
- **Socket.IO** pour le temps réel (namespace `/realtime`)
- **MongoDB** + **Mongoose** ODM
- **JWT** (`@nestjs/jwt` + `passport-jwt`) + **bcrypt**
- **DOMPurify** (`isomorphic-dompurify`) pour la sanitisation XSS
- **class-validator** + **class-transformer** pour la validation des entrées
- **Docker / Docker Compose** pour l'environnement local

---

## Démarrage rapide

### 1. Prérequis

- Node.js ≥ 20
- (optionnel) MongoDB local ou Docker — le mode `start:demo` n'en a pas besoin.

### 2. Installation

```bash
cd Backend
npm install
cp .env.example .env
# Éditer .env si nécessaire (JWT_SECRET, MONGODB_URI…)
```

### 3. Lancer en local

```bash
# Mode démo : MongoDB en mémoire (zéro install), idéal pour hackathon
npm run start:demo

# Avec Docker (persistance, démarre MongoDB + backend conteneurisé)
docker compose up -d

# Avec un MongoDB local déjà installé sur localhost:27017
npm run start:dev
```

Vérifier que le serveur répond :

```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }
```

---

## Variables d'environnement

Toutes documentées dans [`.env.example`](.env.example).

| Variable | Obligatoire | Description |
|---|---|---|
| `PORT` | non (défaut 3000) | Port HTTP/WebSocket |
| `CORS_ORIGIN` | non | Origine autorisée pour le frontend |
| `MONGODB_URI` | **oui** | URI de connexion MongoDB |
| `JWT_SECRET` | **oui** | Secret de signature de l'access token |
| `JWT_REFRESH_SECRET` | **oui** | Secret du refresh token |
| `JWT_EXPIRES_IN` | non (1d) | Durée de vie access token |
| `JWT_REFRESH_EXPIRES_IN` | non (7d) | Durée de vie refresh token |
| `INVITATION_TTL_HOURS` | non (72) | Durée d'expiration d'une invitation |
| `FRONTEND_URL` | non | URL frontend, utilisée pour générer le lien d'invitation |
| `AI_PROVIDER` | non (mock) | `mock` (offline) ou `openai` |
| `OPENAI_API_KEY` | si `openai` | Clé d'API |
| `OPENAI_MODEL` | non (gpt-4o-mini) | Modèle utilisé |

> 💡 En mode démo hackathon sans clé d'API, garde `AI_PROVIDER=mock` :
> le bot produit un résumé local plausible en 3 phrases.

---

## Structure du projet

```
Backend/src/
├── main.ts                       # Bootstrap, CORS, ValidationPipe, filtres
├── app.module.ts                 # Module racine, JwtAuthGuard global, Mongoose
├── health.controller.ts          # GET /health (public)
├── config/
│   └── configuration.ts          # Lecture typée des variables d'env
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts     # Guard global, exempte les routes @Public()
│   └── utils/
│       └── sanitize.util.ts      # Sanitisation XSS (DOMPurify)
├── auth/                         # Inscription, connexion, JWT strategy
├── users/                        # Profil utilisateur
├── workspaces/                   # Espaces de travail + membres + rôles
├── channels/                     # Canaux thématiques
├── messages/                     # Messages canal + Gateway Socket.IO + épinglage
├── direct-messages/              # Messages privés (DM)
├── invitations/                  # Liens d'invitation (onboarding)
└── ai-summary/                   # Bot IA — résumé en 3 phrases
```

---

## API REST

> Toutes les routes sont préfixées par `/api`. Sauf mention contraire, elles requièrent
> un header `Authorization: Bearer <accessToken>`.

### Authentification (public)

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Création de compte (`invitationToken` optionnel) |
| `POST` | `/api/auth/login` | Connexion |

### Utilisateurs

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/users/me` | Profil courant |
| `PATCH` | `/api/users/me` | Met à jour nom / avatar |
| `GET` | `/api/users/:id` | Profil public d'un utilisateur |

### Workspaces

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/workspaces` | Créer un workspace (devient modérateur) |
| `GET` | `/api/workspaces` | Mes workspaces |
| `GET` | `/api/workspaces/:id` | Détail (membre requis) |
| `GET` | `/api/workspaces/:id/members` | Membres |

### Canaux

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/workspaces/:workspaceId/channels` | Créer (modérateur) |
| `GET` | `/api/workspaces/:workspaceId/channels` | Liste |
| `GET` | `/api/channels/:id` | Détail |
| `PATCH` | `/api/channels/:id` | Renommer / mettre à jour (modérateur) |
| `DELETE` | `/api/channels/:id` | Supprimer + purger les messages (modérateur, sauf `general`) |

### Messages

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/channels/:channelId/messages` | Envoyer (Markdown sanitisé) |
| `GET` | `/api/channels/:channelId/messages?before=<date>&limit=50&pinned=false` | Historique |
| `PATCH` | `/api/messages/:messageId` | Éditer (auteur) |
| `DELETE` | `/api/messages/:messageId` | Supprimer (auteur ou modérateur) |
| `POST` | `/api/messages/:messageId/pin` | Épingler (modérateur) |
| `POST` | `/api/messages/:messageId/unpin` | Désépingler (modérateur) |

### Messages directs (DM)

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/direct-messages` | Envoyer (`toUserId`, `content`) |
| `GET` | `/api/direct-messages` | Conversations récentes |
| `GET` | `/api/direct-messages/:otherUserId` | Historique d'une conversation |
| `POST` | `/api/direct-messages/:messageId/read` | Marquer lu |

### Invitations

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/workspaces/:workspaceId/invitations` | Générer un lien (modérateur) |
| `GET` | `/api/invitations/:token` | Aperçu (public, pour la page d'onboarding) |

### Bot IA — résumé

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/channels/:channelId/summary` | **Génère un résumé en 3 phrases** |
| `GET` | `/api/channels/:channelId/summary` | Historique des résumés du canal |

---

## API WebSocket (`/realtime`)

Le client se connecte avec son JWT :

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  auth: { token: accessToken },
});
```

### Événements `client → serveur`

| Event | Payload | Effet |
|---|---|---|
| `channel:join` | `{ channelId }` | Rejoint la room du canal |
| `channel:leave` | `{ channelId }` | Quitte la room |
| `message:send` | `{ channelId, content }` | Envoie un message (rapide, ≈ < 300ms) |
| `typing` | `{ channelId }` | Indicateur "écrit en ce moment" |

### Événements `serveur → client`

| Event | Payload | Quand |
|---|---|---|
| `message:new` | `PublicMessage` | Nouveau message dans le canal |
| `message:updated` | `PublicMessage` | Édition ou (dés)épinglage |
| `message:deleted` | `{ channelId, messageId }` | Suppression (diffusé uniquement à la room du canal) |
| `typing` | `{ channelId, userId, userName, isTyping }` | Quelqu'un tape (`userName` = nom d'affichage) |
| `summary:new` | `{ id, channelId, sentences[3], ... }` | Le bot IA a posté un résumé |

---

## Sécurité

### 1. Sanitisation XSS (obligatoire)

Tous les contenus utilisateurs passent par `sanitizeMarkdownContent` ou
`sanitizePlainText` (cf. [`src/common/utils/sanitize.util.ts`](src/common/utils/sanitize.util.ts))
**avant** d'être stockés :

- les balises `<script>`, `<iframe>`, `<style>`, etc. sont supprimées ;
- les attributs `onerror=`, `onclick=`, … sont supprimés ;
- les URL `javascript:` dans les liens Markdown sont neutralisées.

> Le rendu HTML reste sous la responsabilité du frontend (react-markdown +
> rehype-sanitize). Cette double barrière garantit qu'un script malveillant
> ne peut être ni stocké, ni exécuté.

### 2. Authentification

- Mots de passe hashés avec **bcrypt** (10 rounds par défaut).
- JWT signés HS256. Access token court (1j), refresh token long (7j).
- Garde JWT globale : toute route non annotée `@Public()` exige un token valide.
- Les WebSockets vérifient le JWT au moment de la connexion.

### 3. Validation des entrées

- Validation stricte via `ValidationPipe` global (whitelist + forbidNonWhitelisted).
- Tous les DTO utilisent `class-validator`.

---

## Vérification et tests des flux critiques

### Tests automatisés (e2e)

```bash
npm run test:e2e
```

Lance Jest contre une instance NestJS réelle adossée à un MongoDB en mémoire
(`mongodb-memory-server`). Aucune dépendance externe n'est nécessaire.

Suites couvertes (40 tests) :

- **`test/app.e2e-spec.ts`** — REST : santé, auth (register/login + erreurs),
  workspaces, canaux, règles de modération, messages (envoi, sanitisation XSS,
  édition, épinglage, suppression), invitations (preview public, consommation,
  expiration), messages directs, bot IA (résumé en 3 phrases via provider mock).
- **`test/realtime.e2e-spec.ts`** — Socket.IO : rejet des connexions sans
  JWT / avec JWT invalide, diffusion `message:new`, voie rapide `message:send`,
  diffusion `summary:new` après génération d'un résumé IA.

### Flux critiques (résumé)

| Flux | Étapes simulées |
|---|---|
| **Onboarding** | 1) Modérateur crée une invitation → URL générée. 2) Nouvel utilisateur appelle `POST /auth/register` avec `invitationToken`. 3) L'utilisateur est ajouté comme membre. 4) Le canal `#general` (créé à la naissance du workspace) est accessible. |
| **Envoi de message** | 1) Connexion WS avec JWT. 2) `channel:join`. 3) `message:send` → réponse < 300 ms ; tous les autres clients reçoivent `message:new`. |
| **Épinglage** | 1) Modérateur appelle `POST /messages/:id/pin` → message marqué `pinned: true`. 2) Tous les clients reçoivent `message:updated`. |
| **Résumé IA** | 1) `POST /channels/:id/summary`. 2) Provider `mock` ou `openai` renvoie 3 phrases. 3) Sauvegarde + diffusion WebSocket `summary:new`. |
| **DM** | 1) `POST /direct-messages` → message stocké. 2) `GET /direct-messages` liste les conversations triées par récence. |

---

## Performance

- Pool de connexions Mongo `maxPoolSize: 20` (cf. `app.module.ts`).
- Index `(channelId, createdAt desc)` sur Message pour pagination rapide.
- Pagination basée sur **curseur** (`before=<date>`) plutôt que `skip/limit`.
- Index unique sur `(workspaceId, userId)` pour les membres.
- Index TTL sur `expiresAt` des invitations : Mongo nettoie automatiquement.

---

## Dépendances et points à connaître

- **`isomorphic-dompurify`** : version isomorphe de DOMPurify, fonctionne en Node.
- **`@nestjs/platform-socket.io`** : adaptateur WebSocket NestJS.
- **`fetch` natif** : utilisé pour appeler l'API OpenAI (Node ≥ 18 requis).
- Le mode IA par défaut est `mock` → aucune dépendance externe nécessaire pour démo.
- En production, prévoir : rate-limiting, journalisation structurée, secrets gérés hors `.env`, et un store Redis pour la révocation de JWT.

---

## Roadmap (hors MVP backend)

- Threads (fils de discussion sous un message).
- Recherche full-text (Atlas Search ou `$text`).
- Appels de groupe (intégration LiveKit).
- Dashboard administrateur (endpoints `/admin/*`).
- Limitation de débit (rate limit) sur `auth/*` et `summary`.

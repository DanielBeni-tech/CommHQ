# Cahier des charges — Syntra

> **Thème 13 : Syntra — Le Messager Technique Sécurisé**
> Application de chat d'entreprise organisée par canaux thématiques, avec rendu natif
> du Markdown, des blocs de code et de la coloration syntaxique, enrichie d'un bot IA
> capable de résumer une discussion en trois phrases clés.

| | |
|---|---|
| **Version du document** | 1.0 |
| **Date** | Juin 2026 |
| **Contexte** | Hackathon |
| **Statut** | Brouillon initial — à valider par l'équipe |

---

## 1. Présentation du projet

### 1.1 Concept

**Syntra** est une plateforme de communication d'entreprise temps réel, pensée pour des
équipes techniques. Elle reprend les codes éprouvés de Slack et Discord (espaces de
travail, canaux, messages directs, rôles) tout en mettant l'accent sur ce qui manque
souvent à ces outils pour les développeurs :

- un **rendu propre et natif des blocs de code** avec coloration syntaxique multi-langages ;
- un **support complet du Markdown** dans les messages et les fichiers `.md` partagés ;
- un **assistant IA de canal** qui résume une conversation en **trois phrases clés** pour
  permettre aux managers de rattraper rapidement les décisions importantes.

### 1.2 Objectifs

| Objectif | Description |
|---|---|
| **O1** | Permettre à une entreprise de communiquer en temps réel via des canaux thématiques. |
| **O2** | Offrir un rendu de code et de Markdown de qualité « éditeur ». |
| **O3** | Gérer trois niveaux de rôles (utilisateur, modérateur, administrateur). |
| **O4** | Sécuriser l'accès via un onboarding par invitation (email ou lien d'entreprise). |
| **O5** | Fournir un bot IA de résumé de discussion en 3 phrases clés. |
| **O6** | Supporter les messages directs et les appels de groupe. |

### 1.3 Périmètre

Le périmètre couvre une application web (responsive) composée d'un frontend, d'un backend
temps réel, d'une base de données et d'un service de résumé IA. Les applications mobiles
natives sont **hors périmètre** pour cette première version.

---

## 2. Acteurs et rôles

Syntra s'appuie sur un modèle de rôles inspiré de Slack/Discord, du plus restreint au
plus large.

### 2.1 Utilisateur (Membre)

- Rejoint un espace de travail via un lien d'invitation.
- Crée son profil (nom, photo, mot de passe).
- Parcourt les canaux textuels auxquels il a accès.
- Envoie des messages (texte, Markdown, blocs de code colorés, fichiers `.md`).
- Envoie des **messages directs** à d'autres membres.
- Participe à des **appels de groupe**.
- Réagit aux messages, mentionne d'autres membres, recherche dans l'historique.

### 2.2 Modérateur

> Un utilisateur **devient modérateur de l'espace qu'il crée** (comme le créateur d'un
> serveur Discord ou d'un workspace Slack).

En plus des droits d'un utilisateur :

- Crée, organise, renomme et supprime des canaux.
- Structure les espaces de diffusion (catégories, ordre, descriptions).
- **Épingle les messages importants** d'un canal.
- Gère les membres de son espace (invitations, exclusions, attribution de rôles internes).
- Déclenche / configure le bot de résumé IA sur ses canaux.

### 2.3 Administrateur

> Gère **l'ensemble de la plateforme** depuis un tableau de bord dédié.

- Contrôle la **sécurité globale** (politiques de mot de passe, sessions, journaux d'audit).
- Gère la **structure globale** (liste des espaces de travail, des utilisateurs, des rôles).
- Supervise les données du site et les statistiques d'usage.
- Suspend / réactive des comptes ou des espaces.
- Gère les paramètres de la fonction IA (quotas, activation globale).

### 2.4 Bot IA de canal

Acteur non humain. Sur demande (ou périodiquement), il lit les messages récents d'un
canal et publie un **résumé en trois phrases clés** mettant en avant les décisions et les
points d'action.

---

## 3. Parcours utilisateurs

### 3.1 Onboarding (première connexion)

1. L'entreprise (ou un modérateur) génère un **lien d'invitation** — envoyé par email
   ou partagé directement.
2. L'utilisateur clique sur le lien ; le jeton d'invitation est validé.
3. **Création du profil** : nom, photo de profil, mot de passe.
4. Redirection automatique vers le **canal de bienvenue** de l'espace de travail.

### 3.2 Routine quotidienne (utilisateur)

- Connexion → liste des espaces et canaux.
- Lecture / écriture dans les canaux textuels.
- Rédaction de messages riches : Markdown, blocs de code avec coloration syntaxique,
  partage de fichiers `.md`.
- Messages directs (1-à-1).
- Démarrage ou participation à un **appel de groupe**.
- Recherche, réactions, mentions, fil de discussion (threads — optionnel).

### 3.3 Parcours modérateur

- Création d'un espace → devient automatiquement modérateur.
- Création et organisation des canaux (catégories, ordre).
- Épinglage des messages clés.
- Invitation de nouveaux membres (génération de liens).
- Activation du bot de résumé IA.

### 3.4 Parcours administrateur

- Accès au **dashboard d'administration** (interface séparée).
- Visualisation et gestion de tous les espaces, canaux et utilisateurs.
- Configuration de la sécurité (politiques, audit, sessions).
- Pilotage des quotas IA et des paramètres globaux.

---

## 4. Exigences fonctionnelles

Priorisation **MoSCoW** : `M` (Must), `S` (Should), `C` (Could), `W` (Won't / plus tard).

### 4.1 Authentification & comptes

| Réf | Exigence | Priorité |
|---|---|---|
| F-AUTH-1 | Onboarding par lien d'invitation (email ou lien d'entreprise) avec jeton à durée limitée. | M |
| F-AUTH-2 | Création de profil : nom, photo, mot de passe (hashé). | M |
| F-AUTH-3 | Connexion / déconnexion sécurisées (JWT + refresh token). | M |
| F-AUTH-4 | Réinitialisation de mot de passe. | S |
| F-AUTH-5 | Double authentification (2FA). | C |

### 4.2 Espaces de travail, canaux & rôles

| Réf | Exigence | Priorité |
|---|---|---|
| F-WS-1 | Création d'un espace de travail (le créateur devient modérateur). | M |
| F-WS-2 | Création / organisation / suppression de canaux (texte). | M |
| F-WS-3 | Canal de bienvenue par défaut à la création de l'espace. | M |
| F-WS-4 | Attribution de rôles (membre / modérateur). | M |
| F-WS-5 | Catégories de canaux et réordonnancement. | S |
| F-WS-6 | Canaux privés (accès restreint). | S |

### 4.3 Messagerie temps réel

| Réf | Exigence | Priorité |
|---|---|---|
| F-MSG-1 | Envoi / réception de messages en temps réel (WebSocket). | M |
| F-MSG-2 | Rendu **Markdown** complet (titres, listes, liens, tableaux, citations). | M |
| F-MSG-3 | Rendu des **blocs de code** avec coloration syntaxique multi-langages. | M |
| F-MSG-4 | Partage et rendu de fichiers `.md`. | M |
| F-MSG-5 | Indicateurs de présence et « est en train d'écrire… ». | S |
| F-MSG-6 | Réactions (emojis), mentions `@`, édition / suppression de message. | S |
| F-MSG-7 | **Épinglage** de messages (modérateur). | M |
| F-MSG-8 | Messages directs (1-à-1). | M |
| F-MSG-9 | Recherche dans l'historique. | S |
| F-MSG-10 | Threads (fils de discussion). | C |
| F-MSG-11 | Upload de fichiers / images génériques. | S |

### 4.4 Appels de groupe

| Réf | Exigence | Priorité |
|---|---|---|
| F-CALL-1 | Appel audio de groupe (WebRTC). | S |
| F-CALL-2 | Appel vidéo de groupe. | C |
| F-CALL-3 | Partage d'écran. | W |

### 4.5 Bot IA de résumé

| Réf | Exigence | Priorité |
|---|---|---|
| F-AI-1 | Résumer la discussion d'un canal en **3 phrases clés** sur demande. | M |
| F-AI-2 | Mettre en avant décisions et actions à mener. | S |
| F-AI-3 | Résumé périodique automatique (quotidien). | C |
| F-AI-4 | Commande dédiée (ex. `/resume`) déclenchant le bot. | S |

### 4.6 Administration

| Réf | Exigence | Priorité |
|---|---|---|
| F-ADM-1 | Dashboard listant espaces, canaux, utilisateurs. | M |
| F-ADM-2 | Suspension / réactivation de comptes et d'espaces. | S |
| F-ADM-3 | Journal d'audit (connexions, actions sensibles). | S |
| F-ADM-4 | Statistiques d'usage. | C |
| F-ADM-5 | Configuration des quotas IA. | C |

---

## 5. Exigences non fonctionnelles

| Réf | Catégorie | Exigence |
|---|---|---|
| NF-1 | **Sécurité** | Mots de passe hashés (bcrypt/argon2), HTTPS, JWT signés, validation des entrées, protection XSS sur le rendu Markdown (sanitisation). |
| NF-2 | **Performance** | Livraison d'un message < 300 ms en temps réel ; chargement initial < 2 s. |
| NF-3 | **Scalabilité** | Architecture découplée permettant la montée en charge du service WebSocket. |
| NF-4 | **Disponibilité** | Reconnexion automatique du client en cas de coupure réseau. |
| NF-5 | **Accessibilité** | Contrastes suffisants, navigation clavier, sémantique HTML. |
| NF-6 | **Compatibilité** | Navigateurs modernes (Chrome, Firefox, Edge, Safari) ; responsive desktop/mobile. |
| NF-7 | **Maintenabilité** | Code typé, structuré par modules, conventions de commit, documentation. |
| NF-8 | **Confidentialité** | Les données envoyées au service IA sont limitées au strict nécessaire. |

### 5.1 Sécurité du rendu Markdown / code

Point critique : le rendu de Markdown et de code venant d'utilisateurs est une surface
d'attaque XSS. Le HTML généré **doit être sanitisé** (ex. `rehype-sanitize`) et le code
n'est jamais exécuté, seulement coloré et affiché.

---

## 6. Stack technique recommandée

> Objectif : une stack **cohérente, rapide à mettre en œuvre dans un cadre hackathon**,
> avec un écosystème mature pour le temps réel, le Markdown/code et l'IA.

### 6.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────┐
│                         Client (Web)                           │
│  React + TypeScript + Vite + TailwindCSS + shadcn/ui           │
│  Markdown/Code : react-markdown + remark-gfm + Shiki           │
│  Temps réel : Socket.IO client   •   Appels : LiveKit / WebRTC │
└───────────────┬───────────────────────────┬──────────────────┘
                │ REST (HTTP)                 │ WebSocket
                ▼                             ▼
┌──────────────────────────────────────────────────────────────┐
│                      Backend (API + RT)                        │
│            NestJS (TypeScript) — REST + Socket.IO              │
│  Auth JWT • Gestion rôles • Modération • Service de résumé IA  │
└───────────────┬───────────────────────────┬──────────────────┘
                │                             │
                ▼                             ▼
        ┌───────────────┐            ┌──────────────────┐
        │   MongoDB      │            │  API LLM (IA)    │
        │ (Mongoose ODM) │            │ résumé 3 phrases │
        └───────────────┘            └──────────────────┘
```

### 6.2 Détail des choix

| Domaine | Techno recommandée | Justification |
|---|---|---|
| **Frontend** | React 18 + TypeScript + **Vite** | Démarrage rapide, écosystème riche, typage fort. |
| **UI / Style** | TailwindCSS + **shadcn/ui** | Composants accessibles et beaux, rapides à composer. |
| **État / données** | TanStack Query + Zustand | Cache serveur + état UI léger. |
| **Markdown** | `react-markdown` + `remark-gfm` + `rehype-sanitize` | Rendu Markdown complet et **sécurisé**. |
| **Coloration code** | **Shiki** (ou Prism.js) | Coloration de qualité « VS Code », multi-langages. |
| **Temps réel** | **Socket.IO** | API simple, reconnexion, rooms (canaux) intégrées. |
| **Appels de groupe** | **LiveKit** (ou PeerJS/WebRTC) | SDK clé en main pour audio/vidéo de groupe. |
| **Backend** | **NestJS** (Node.js + TypeScript) | Architecture modulaire, support natif WebSocket + REST, un seul langage sur tout le projet. |
| **Base de données** | **MongoDB** + Mongoose | Modèle documentaire adapté aux messages/canaux, flexible et rapide à itérer. |
| **Authentification** | JWT (access + refresh), bcrypt/argon2 | Standard, stateless, adapté au temps réel. |
| **IA / Résumé** | API LLM (OpenAI / Anthropic / modèle fourni) | Génération du résumé en 3 phrases via prompt dédié. |
| **Stockage fichiers** | Stockage objet (S3 compatible) ou local | Photos de profil, fichiers `.md` et pièces jointes. |
| **Déploiement** | Docker + Docker Compose | Environnement reproductible (front, back, Mongo). |

### 6.3 Décision

✅ **Backend retenu : NestJS (Node.js + TypeScript).** Ce choix unifie le langage
(TypeScript) sur tout le projet — frontend, backend et couche temps réel — ce qui
accélère le développement en contexte hackathon et limite les changements de contexte.

> *Alternative écartée :* un backend **Spring Boot + WebSocket (STOMP) + MongoDB** restait
> possible (compétences Java de l'équipe) mais n'a pas été retenu afin de garder une stack
> homogène en TypeScript.

---

## 7. Modèle de données (vue logique)

Collections MongoDB principales :

- **User** : `_id`, `name`, `email`, `avatarUrl`, `passwordHash`, `globalRole` (`user` | `admin`), `createdAt`.
- **Workspace** : `_id`, `name`, `ownerId`, `createdAt`.
- **WorkspaceMember** : `workspaceId`, `userId`, `role` (`member` | `moderator`).
- **Channel** : `_id`, `workspaceId`, `name`, `type` (`text`), `categoryId`, `order`, `isPrivate`.
- **Message** : `_id`, `channelId`, `authorId`, `content` (Markdown brut), `attachments[]`, `pinned`, `editedAt`, `createdAt`.
- **DirectMessage** : `_id`, `participants[]`, `content`, `createdAt`.
- **Reaction** : `messageId`, `userId`, `emoji`.
- **Invitation** : `_id`, `workspaceId`, `token`, `email?`, `expiresAt`, `usedBy?`.
- **Summary** : `_id`, `channelId`, `text` (3 phrases), `range` (période couverte), `createdAt`.

> Le contenu des messages est **stocké en Markdown brut** et rendu côté client. La
> sanitisation est appliquée au rendu, jamais au stockage.

---

## 8. Architecture & API (aperçu)

### 8.1 Endpoints REST (extrait)

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — (jeton invitation) | Création de profil. |
| `POST` | `/auth/login` | — | Connexion. |
| `POST` | `/workspaces` | utilisateur | Crée un espace (devient modérateur). |
| `POST` | `/workspaces/:id/channels` | modérateur | Crée un canal. |
| `GET` | `/channels/:id/messages` | membre | Historique paginé. |
| `POST` | `/messages/:id/pin` | modérateur | Épingle un message. |
| `POST` | `/channels/:id/summary` | membre | Déclenche le résumé IA (3 phrases). |
| `POST` | `/workspaces/:id/invitations` | modérateur | Génère un lien d'invitation. |
| `GET` | `/admin/overview` | admin | Données du dashboard. |

### 8.2 Événements WebSocket (extrait)

| Événement | Sens | Description |
|---|---|---|
| `channel:join` | client → serveur | Rejoint la « room » d'un canal. |
| `message:send` | client → serveur | Envoi d'un message. |
| `message:new` | serveur → client | Diffusion d'un nouveau message. |
| `typing` | bidirectionnel | Indicateur de frappe. |
| `presence:update` | serveur → client | Mise à jour de présence. |

---

## 9. Fonction IA — résumé en 3 phrases

1. Sur déclenchement (`/resume` ou bouton « Résumer »), le backend récupère les N derniers
   messages du canal (ou ceux d'une période).
2. Les messages sont concaténés et envoyés à l'API LLM avec un **prompt contraint** :
   *« Résume cette discussion en exactement 3 phrases clés, en mettant en avant les
   décisions prises et les actions à mener. »*
3. Le résumé est stocké (collection `Summary`) puis publié dans le canal par le **bot**.

Contraintes : limiter le volume de contexte envoyé (fenêtre glissante), ne pas transmettre
de données sensibles non nécessaires, gérer les quotas (NF-8 / F-ADM-5).

---

## 10. Lots de livraison (proposition pour le hackathon)

| Lot | Contenu | Priorité |
|---|---|---|
| **Lot 1 — Cœur** | Auth + invitation, espaces, canaux, messagerie temps réel, rendu Markdown/code. | M |
| **Lot 2 — Collaboration** | Messages directs, réactions, mentions, épinglage, recherche. | S |
| **Lot 3 — IA** | Bot de résumé en 3 phrases. | M (bonus différenciant) |
| **Lot 4 — Appels** | Appels de groupe (audio). | S |
| **Lot 5 — Admin** | Dashboard administrateur + sécurité. | S |

> Recommandation hackathon : viser **Lot 1 + Lot 3** comme démonstrateur minimum
> impressionnant (« MVP démo »), puis compléter selon le temps disponible.

---

## 11. Critères d'acceptation (MVP)

- [ ] Un utilisateur peut rejoindre via un lien d'invitation et créer son profil.
- [ ] Il arrive sur le canal de bienvenue.
- [ ] Il peut envoyer un message Markdown et un bloc de code coloré, visible en temps réel par un autre utilisateur.
- [ ] Le créateur d'un espace est modérateur et peut créer/épingler.
- [ ] Le bot IA produit un résumé en 3 phrases d'un canal.

---

## 12. Risques & points d'attention

| Risque | Impact | Mitigation |
|---|---|---|
| XSS via Markdown utilisateur | Élevé | Sanitisation systématique au rendu. |
| Complexité des appels WebRTC | Moyen | Utiliser un SDK (LiveKit) plutôt que du WebRTC brut. |
| Coût / quota API IA | Moyen | Limiter le contexte, mettre en cache les résumés. |
| Temps limité (hackathon) | Élevé | Prioriser strictement (Lot 1 + Lot 3). |

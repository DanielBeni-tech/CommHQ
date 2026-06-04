# CommHQ — Le Messager Technique Sécurisé

> Application de chat d'entreprise organisée par canaux thématiques, avec rendu natif du
> Markdown, des blocs de code et de la coloration syntaxique, enrichie d'un **bot IA** qui
> résume une discussion en **trois phrases clés**.

**Thème 13 — Projet Hackathon**

---

## Sommaire

- [Présentation](#présentation)
- [Fonctionnalités clés](#fonctionnalités-clés)
- [Rôles](#rôles)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Démarrage rapide](#démarrage-rapide)
- [Documentation](#documentation)
- [Roadmap](#roadmap)

---

## Présentation

CommHQ reprend les codes de Slack et Discord (espaces de travail, canaux, rôles, messages
directs) en se concentrant sur l'expérience des **équipes techniques** : un rendu de code
et de Markdown de qualité « éditeur », et un assistant IA pour rattraper rapidement les
décisions d'un canal.

## Fonctionnalités clés

- 💬 **Chat temps réel** organisé par espaces de travail et canaux thématiques.
- 🎨 **Rendu Markdown complet** + **coloration syntaxique** des blocs de code (multi-langages).
- 📄 Partage et rendu de fichiers `.md`.
- 🔐 **Onboarding par invitation** (email ou lien d'entreprise), création de profil (nom, photo, mot de passe).
- 📌 **Épinglage** des messages importants, réactions, mentions.
- ✉️ **Messages directs** et 📞 **appels de groupe**.
- 🤖 **Bot IA** : résumé d'une discussion en **3 phrases clés**.
- 🛡️ **Dashboard administrateur** pour la sécurité et la structure globale.

## Rôles

| Rôle | Description |
|---|---|
| **Utilisateur** | Rejoint via invitation, discute, partage code/Markdown, MP, appels. |
| **Modérateur** | Créateur d'un espace : gère canaux, organisation, épinglage, membres. |
| **Administrateur** | Contrôle la sécurité, la structure globale et les données via le dashboard. |
| **Bot IA** | Publie des résumés de discussion en 3 phrases. |

## Stack technique

| Couche | Technologies |
|---|---|
| **Frontend** | React + TypeScript + Vite, TailwindCSS, shadcn/ui |
| **Markdown / Code** | react-markdown, remark-gfm, rehype-sanitize, Shiki |
| **Temps réel** | Socket.IO |
| **Appels** | LiveKit / WebRTC |
| **Backend** | NestJS (Node.js + TypeScript) — REST + WebSocket |
| **Base de données** | MongoDB (Mongoose) |
| **Auth** | JWT (access + refresh), bcrypt/argon2 |
| **IA** | API LLM (résumé en 3 phrases) |
| **Infra** | Docker + Docker Compose |

> Détails et justifications dans le [cahier des charges](Documentation/Cahier_des_charges.md#6-stack-technique-recommandée).

## Architecture

```
Client (React)  ──REST──▶  Backend (NestJS)  ──▶  MongoDB
       │                        │
       └──── WebSocket ─────────┘
                                │
                                └──▶  API LLM (résumé IA)
```

## Structure du projet

```
CommHQ/
├── Documentation/
│   └── Cahier_des_charges.md      # Spécifications complètes
├── Backend/                       # API NestJS + WebSocket Socket.IO
│   ├── src/                       # Code source modules NestJS
│   ├── test/                      # Tests e2e (REST + Realtime)
│   ├── scripts/start-with-memdb.js  # Démarrage avec MongoDB en mémoire
│   ├── docker-compose.yml         # MongoDB + backend conteneurisés
│   └── .env(.example)
├── frontend/                      # App React + Vite + TailwindCSS
│   ├── src/
│   └── .env(.example)
└── README.md
```

## Démarrage rapide (démo locale)

Pré-requis : **Node.js ≥ 20**.

Trois scénarios sont supportés selon ce que vous avez installé.

### A. Démo express — sans Docker, sans MongoDB local *(recommandé)*

Le backend embarque un script qui spinne **MongoDB en mémoire** via
`mongodb-memory-server`. Aucune installation de base de données n'est nécessaire.

```bash
# 1) Backend (terminal 1)
cd Backend
cp .env.example .env          # ou laisser tel quel : valeurs par défaut OK
npm install
npm run start:demo            # → http://localhost:3000/api

# 2) Frontend (terminal 2)
cd frontend
cp .env.example .env          # VITE_USE_MOCKS=false par défaut
npm install
npm run dev                   # → http://localhost:5173
```

> Les données ne sont **pas persistées** entre deux exécutions de `start:demo`
> (c'est attendu pour la démo). Pour persister, voir scénario B ou C.

### B. Avec Docker Compose

```bash
cd Backend
cp .env.example .env
docker compose up -d          # lance Mongo + backend conteneurisé

cd ../frontend
cp .env.example .env
npm install && npm run dev
```

### C. Avec un MongoDB local installé

```bash
# Démarrer MongoDB (service Windows/macOS, brew services, etc.)

cd Backend
cp .env.example .env          # MONGODB_URI=mongodb://localhost:27017/commhq
npm install
npm run start:dev

cd ../frontend
cp .env.example .env
npm install && npm run dev
```

### Variables d'environnement utiles

**Backend (`Backend/.env`)**

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/commhq    # ignoré par start:demo
JWT_SECRET=hackathon-syntra-jwt-secret-change-me-in-prod
JWT_REFRESH_SECRET=hackathon-syntra-refresh-secret-change-me
INVITATION_TTL_HOURS=72
FRONTEND_URL=http://localhost:5173

# IA : `mock` = résumé local (offline). `openai` = appel à OpenAI.
AI_PROVIDER=mock
OPENAI_API_KEY=               # uniquement si AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
```

**Frontend (`frontend/.env`)**

```env
VITE_API_URL=http://localhost:3000     # le préfixe /api est ajouté côté client
VITE_WS_URL=http://localhost:3000      # le namespace /realtime est ajouté côté client
VITE_USE_MOCKS=false                   # `true` = MSW (sans backend)
```

## Mode d'emploi de l'application

Une fois le frontend ouvert sur http://localhost:5173 :

1. **Créer un compte** depuis la page de connexion (lien *Créer un compte*).
   - Le premier compte créé sera *modérateur* du workspace qu'il créera.
2. **Créer un workspace** depuis l'icône `+` du rail latéral gauche.
   - Un canal `#general` est créé automatiquement.
3. **Créer un canal** (modérateur uniquement) — bouton `+` dans la barre des canaux.
4. **Discuter** : Markdown complet supporté, blocs de code triple-backticks
   avec coloration Shiki (`\`\`\`ts`, `\`\`\`python`…), épinglage, édition,
   suppression.
5. **Inviter un collègue** : icône d'invitation du workspace → copie un lien
   `/register?invite=…` à partager. Le destinataire crée son compte et rejoint
   automatiquement le workspace en tant que membre.
6. **Résumé IA** : bouton ✨ *Résumer le canal* en haut à droite, ou *Actualiser*
   dans le bandeau IA. Le résumé apparaît en 3 phrases mettant en avant les
   décisions et les actions à mener.

### Tester rapidement le bot IA

Le provider `mock` (par défaut) génère un résumé déterministe à partir des
messages — utile pour la démo sans clé API. Pour de vrais résumés OpenAI :

```env
# Backend/.env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Puis redémarrer le backend.

## Tests automatisés

Le backend dispose d'une suite e2e complète (REST + WebSocket) basée sur
`mongodb-memory-server`. Aucun service externe n'est requis :

```bash
cd Backend
npm run test:e2e
```

Couverture : auth (register/login/JWT), workspaces, canaux, messages
(envoi/sanitisation XSS/édition/suppression/épinglage), invitations,
messages directs, bot IA (3 phrases), passerelle Socket.IO (connexion
authentifiée, broadcast `message:new`, `summary:new`).

## Documentation

- 📑 [Cahier des charges](Documentation/Cahier_des_charges.md) — exigences fonctionnelles
  et non fonctionnelles, stack détaillée, modèle de données, API, roadmap.

## Roadmap

- [ ] **Lot 1 — Cœur** : auth/invitation, espaces, canaux, messagerie temps réel, rendu Markdown/code.
- [ ] **Lot 3 — IA** : bot de résumé en 3 phrases (bonus différenciant).
- [ ] **Lot 2 — Collaboration** : MP, réactions, mentions, épinglage, recherche.
- [ ] **Lot 4 — Appels** : appels de groupe.
- [ ] **Lot 5 — Admin** : dashboard administrateur + sécurité.

---

*Projet réalisé dans le cadre d'un hackathon — Thème 13 : CommHQ.*

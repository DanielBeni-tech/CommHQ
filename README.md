# Syntra — Le Messager Technique Sécurisé

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

Syntra reprend les codes de Slack et Discord (espaces de travail, canaux, rôles, messages
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
Syntra/
├── Documentation/
│   └── Cahier_des_charges.md     # Spécifications complètes
├── frontend/                     # App React (à venir)
├── backend/                      # API NestJS + WebSocket (à venir)
├── docker-compose.yml            # Orchestration (à venir)
└── README.md
```

> Les dossiers `frontend/` et `backend/` seront créés lors de l'initialisation du code.

## Démarrage rapide

> ⚠️ Le code n'est pas encore initialisé. Procédure prévue une fois les projets en place :

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd Syntra

# 2. Lancer l'environnement (base de données, etc.)
docker compose up -d

# 3. Backend
cd backend
npm install
npm run start:dev

# 4. Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

Variables d'environnement (exemple `.env`) :

```env
# Backend
MONGODB_URI=mongodb://localhost:27017/syntra
JWT_SECRET=changeme
JWT_REFRESH_SECRET=changeme
LLM_API_KEY=...

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

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

*Projet réalisé dans le cadre d'un hackathon — Thème 13 : Syntra.*

# Syntra — Frontend

Interface de **Syntra**, messagerie technique sécurisée (Thème 13, Hackathon J.U.I.N 2026).

Backend cible : **NestJS + Socket.IO + MongoDB** (voir [`../Documentation/Cahier_des_charges.md`](../Documentation/Cahier_des_charges.md)).
Le frontend fonctionne **sans backend** grâce aux mocks MSW + un bus temps réel multi-onglets.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4 + **shadcn/ui** (composants ajoutés via le CLI officiel du registre)
- TanStack Query (état serveur) + Zustand (auth, préférences)
- React Router v7
- react-markdown + remark-gfm + rehype-sanitize + **Shiki** (rendu Markdown et code)
- socket.io-client (temps réel) avec repli **BroadcastChannel** en mode mock
- MSW (API simulée)

Design system généré via la skill **ui-ux-pro-max** : bleu messager `#2563EB` + vert « en ligne »
`#059669`, typographies **IBM Plex Sans** / **JetBrains Mono**.

## Démarrage

```bash
npm install
cp .env.example .env
npm run dev
```

Application sur http://localhost:5173

### Mode démo (sans backend)

`VITE_USE_MOCKS=true` (défaut) : connexion avec **n'importe quels identifiants**
(préremplis : `camille@acme.dev`). Vous arrivez dans l'espace **Acme Corp** en tant que
**modérateur**, avec des canaux pré-remplis (`#backend`, `#incidents`…).

> Astuce : ouvrez deux onglets connectés pour voir la **synchronisation temps réel**
> (messages, frappe) entre eux via BroadcastChannel.

Pour brancher le backend réel : `VITE_USE_MOCKS=false` + NestJS sur `:3000`.

## Fonctionnalités (MVP « Must »)

- Authentification (connexion, inscription par lien d'invitation, déconnexion)
- Espaces de travail : liste, création (le créateur devient **modérateur**), bascule, canal de bienvenue
- Rôles : membre / modérateur (droits différenciés dans l'UI)
- Canaux : liste, création / renommage / suppression (modérateur), canaux privés
- Messagerie temps réel : envoi, **édition**, **suppression**, **épinglage** (modérateur)
- Rendu **Markdown** complet + **coloration syntaxique** multi-langages (Shiki), sanitisé (anti-XSS)
- Indicateur « en train d'écrire » et présence
- **Résumé IA** d'un canal en 3 phrases clés (bonus jury)
- Thème clair / sombre

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | ESLint |

## Structure

```
src/
├── api/          # client axios + services REST
├── components/
│   ├── ui/       # composants shadcn/ui (registre)
│   ├── layout/   # rail espaces, sidebar canaux, carte utilisateur
│   ├── chat/     # messages, Markdown/Shiki, composer, résumé IA
│   ├── channel/  # dialogues de canal
│   ├── workspace/# dialogues d'espace + invitation
│   ├── auth/     # garde + coque d'authentification
│   └── common/   # thème, badges de rôle
├── hooks/        # auth, workspaces, channels, messages, permissions, temps réel
├── mocks/        # MSW (db en mémoire + handlers)
├── realtime/     # abstraction Socket.IO / BroadcastChannel
├── stores/       # Zustand (auth, ui)
└── types/        # modèles partagés
```

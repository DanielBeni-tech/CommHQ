# CommHQ — Prompt Cursor (Frontend · Spring Boot backend)

Ce document contient les **prompts prêts à copier** dans Cursor pour construire le frontend CommHQ. Le backend est géré par votre équipe (Spring Boot). Vous travaillez dans `frontend/`.

---

## 0. Configuration Cursor avant de coder

### 0.1 Règle projet (`.cursor/rules/commhq-frontend.mdc`)

Créez ce fichier une fois, puis référencez-le dans vos prompts :

```markdown
---
description: Règles frontend CommHQ hackathon
globs: frontend/**/*
---

- Stack : React 18, Vite, TypeScript strict, Tailwind, shadcn/ui
- Backend : Spring Boot REST + STOMP WebSocket (contrat openapi.yaml)
- Langue UI : français
- Ne pas modifier le dossier backend/
- Markdown : react-markdown + remark-gfm + rehype-sanitize
- Code : Shiki pour les blocs ```
- Auth : JWT Bearer dans Authorization header
- État : TanStack Query (serveur) + Zustand (auth)
- Mocks : MSW si VITE_USE_MOCKS=true
- Pas de sur-ingénierie : MVP hackathon 24h
```

### 0.2 Fichiers à @mentionner systématiquement

```
@Documentation/Cahier des charges.md
@frontend/openapi.yaml          (quand disponible)
@frontend/src/types/index.ts
```

---

## 1. Prompt maître — initialisation frontend

**Mode :** Agent (ou Composer)  
**Quand :** H+0, repo vide côté frontend

```
Tu es un expert React/TypeScript. Tu construis le frontend de CommHQ pour le hackathon J.U.I.N 2026 (thème 13 : messagerie technique entreprise).

Contexte :
- Backend Spring Boot 3 sur http://localhost:8080 (REST + STOMP WebSocket)
- Je suis responsable du frontend uniquement
- Lis @Documentation/Cahier des charges.md pour le périmètre MVP

Tâche :
1. Créer le projet dans frontend/ avec Vite + React + TypeScript
2. Installer : tailwindcss, @tanstack/react-query, zustand, react-router-dom, axios, react-markdown, remark-gfm, rehype-sanitize, shiki, @stomp/stompjs, sockjs-client
3. Installer shadcn/ui (Button, Input, Textarea, Dialog, Toast, Avatar, ScrollArea)
4. Structure :
   frontend/src/
     api/          (client axios + intercepteur JWT)
     components/   (chat, markdown, auth, layout)
     hooks/        (useAuth, useChannelMessages, useStomp)
     pages/        (Login, Register, Chat)
     stores/       (authStore)
     types/        (User, Channel, Message, ChannelSummary)
     mocks/        (MSW handlers — voir cahier des charges)
5. Variables .env.example : VITE_API_BASE_URL, VITE_WS_URL, VITE_USE_MOCKS
6. README frontend avec npm run dev / build

Contraintes :
- TypeScript strict, pas de any
- UI en français
- Layout chat : sidebar canaux + fil messages + composer (voir cahier des charges §6.1)
- Ne touche pas backend/

Livrer un shell navigable : login → chat avec sidebar vide et placeholder messages.
```

---

## 2. Prompt — contrat API et mocks MSW

**Mode :** Agent  
**Quand :** H+1, en parallèle du backend

```
@Documentation/Cahier des charges.md

Crée frontend/openapi.yaml avec tous les endpoints REST documentés au §5.2 du cahier des charges (auth, channels, messages, summarize).

Puis implémente MSW pour développer sans backend :
- frontend/src/mocks/data.ts : 1 user, 3 canaux (general, backend, incidents), 10 messages dont blocs ```json et ```python
- frontend/src/mocks/handlers.ts : handlers pour chaque endpoint
- frontend/src/mocks/browser.ts : worker MSW
- Activer MSW dans main.tsx si import.meta.env.VITE_USE_MOCKS === 'true'

Génère frontend/src/types/index.ts aligné sur openapi.yaml.

Ajoute frontend/src/api/client.ts :
- baseURL depuis VITE_API_BASE_URL
- intercepteur Authorization Bearer depuis authStore
- gestion 401 → logout + redirect /login
```

---

## 3. Prompt — authentification

**Mode :** Agent

```
@Documentation/Cahier des charges.md
@frontend/src/api/client.ts
@frontend/src/stores/authStore.ts

Implémente l'authentification frontend :

Pages :
- /login : email, password, lien register, erreurs inline
- /register : email, password, displayName

Fonctionnel :
- POST /api/auth/login et /api/auth/register
- Stocker JWT + user dans Zustand, persist localStorage
- AuthGuard sur routes /channels/*
- Header : nom utilisateur + bouton déconnexion
- Redirect / → /channels/general après login

UI : shadcn, formulaire accessible (labels, focus), toast erreur réseau.

Ne pas implémenter OAuth — JWT simple uniquement.
```

---

## 4. Prompt — sidebar canaux + navigation

**Mode :** Agent

```
@Documentation/Cahier des charges.md
@frontend/src/types/index.ts

Implémente la gestion des canaux :

Composants :
- ChannelSidebar : liste depuis GET /api/channels, canal actif surligné
- CreateChannelModal : POST /api/channels (name, description, isPrivate)
- Route /channels/:channelId

Hooks :
- useChannels() avec TanStack Query key ['channels']
- invalidate après création canal

UX :
- Préfixe visuel # devant le nom
- Bouton "+ Nouveau canal" en bas sidebar
- Empty state si aucun canal
- Loading skeleton

Textes en français.
```

---

## 5. Prompt — fil de messages + composer

**Mode :** Agent

```
@Documentation/Cahier des charges.md

Implémente le cœur du chat :

Composants :
- MessageList : GET /api/channels/{id}/messages?page=0&size=50
- MessageItem : avatar (initiales), displayName, createdAt formaté (date-fns, fr)
- MessageComposer : textarea, bouton Envoyer, Ctrl+Enter pour submit
- POST /api/channels/{id}/messages { content }

Comportement :
- Auto-scroll vers le bas à l'ajout message
- Compteur caractères (max 4000)
- Désactiver send si vide
- TanStack Query invalidate ['messages', channelId] après POST
- États loading / error / empty

Le content est du Markdown brut — le rendu viendra au prompt suivant (placeholder texte pour l'instant).
```

---

## 6. Prompt — rendu Markdown + Shiki (critique jury)

**Mode :** Agent  
**Priorité :** haute — différenciateur thème 13

```
@Documentation/Cahier des charges.md

Implémente le rendu Markdown production-ready :

Composants :
- MarkdownRenderer.tsx : react-markdown + remark-gfm + rehype-sanitize
- CodeBlock.tsx : Shiki highlight, thème github-dark ou github-light selon prefers-color-scheme
- Lazy load Shiki langs : json, python, java, sql, bash, typescript

Intégration MessageItem :
- Corps message via MarkdownRenderer
- Bouton "Copier" sur chaque bloc code
- Styles Tailwind : prose prose-sm dark:prose-invert max-w-none

Test visuel : afficher correctement l'exemple du cahier des charges §6.3 (incident API + checklist).

Sécurité : rehype-sanitize obligatoire, pas de dangerouslySetInnerHTML sauf sortie Shiki trusted.
```

---

## 7. Prompt — WebSocket temps réel (STOMP)

**Mode :** Agent  
**Quand :** backend WS prêt (~H+6)

```
@Documentation/Cahier des charges.md

Implémente le temps réel STOMP compatible Spring Boot :

Hook useStomp(channelId) :
- Connexion SockJS + @stomp/stompjs vers VITE_WS_URL
- Header CONNECT : Authorization Bearer <token>
- Subscribe /topic/channels/{channelId} quand channelId change
- Payload : { type: "MESSAGE_CREATED", payload: Message }
- Déconnexion propre au unmount / logout

Intégration MessageList :
- À réception WS : ajouter message si message.id absent (Set des ids)
- Ne pas dupliquer si déjà présent via POST response

Fallback : si WS échoue, refetch TanStack Query toutes les 5s (configurable).

Log console en dev uniquement.
```

---

## 8. Prompt — bouton Résumé IA (bonus hackathon)

**Mode :** Agent

```
@Documentation/Cahier des charges.md

Implémente la fonctionnalité bonus jury :

UI :
- Bouton "Résumer le canal" dans le header du fil (ou sous composer)
- Clic → POST /api/channels/{channelId}/summarize
- SummarizePanel : skeleton loading, affiche summary (3 phrases), messageCount, generatedAt
- Toast erreur si timeout > 15s ou 5xx

TanStack Query :
- key ['summary', channelId]
- staleTime 0 — refetch à chaque clic
- Invalider après envoi nouveau message (optionnel)

Texte bouton et labels en français. Mention "Généré par IA" discret.
```

---

## 9. Prompt — polish UX démo jury

**Mode :** Agent  
**Quand :** H+18 → H+22

```
@Documentation/Cahier des charges.md

Polish MVP pour la démo hackathon :

1. Responsive desktop 1280px minimum, sidebar collapsible < 768px
2. Toasts centralisés (erreurs API, succès création canal)
3. Empty states illustrés (canal sans messages : "Envoyez le premier message technique")
4. Favicon + title "CommHQ"
5. Page loading global pendant check auth
6. Mode sombre Tailwind (class dark sur html) — toggle header optionnel
7. Vérifier checklist §8.1 du cahier des charges

Corriger bugs visuels évidents. Pas de refactor massif.
```

---

## 10. Prompt — intégration backend réel

**Mode :** Agent  
**Quand :** backend déployé localement ou staging

```
Le backend Spring Boot tourne sur @http://localhost:8080

Tâche :
1. Désactiver MSW (VITE_USE_MOCKS=false)
2. Tester manuellement : login, liste canaux, envoi message, WS, summarize
3. Corriger :
   - CORS errors (documenter headers attendus pour l'équipe backend si besoin)
   - Format dates ISO
   - Codes HTTP 401/403/404 → messages UI français
4. Mettre à jour frontend/.env.example avec URLs staging si applicable

Ne modifie pas le code Java. Signale les écarts vs openapi.yaml dans frontend/BACKEND_GAPS.md.
```

---

## 11. Prompts debug rapides (copier selon problème)

### CORS

```
Erreur CORS entre frontend localhost:5173 et backend localhost:8080.
Je ne touche qu'au frontend. Liste les headers que le backend Spring doit exposer et ajoute un proxy Vite temporaire dans vite.config.ts si pertinent.
```

### WebSocket ne connecte pas

```
@frontend/src/hooks/useStomp.ts
Le client STOMP échoue avec [COLLER ERREUR].
Vérifie URL SockJS, headers Authorization, path /ws, et propose fix côté frontend uniquement.
```

### Shiki performance

```
Le rendu Shiki lag sur MessageList avec 50 messages.
Optimise : memo MessageItem, highlight uniquement blocs visibles, ou cache par hash content.
```

### Doublons messages

```
Les messages apparaissent en double après envoi.
Corrige la déduplication entre POST response et événement STOMP MESSAGE_CREATED.
```

---

## 12. Workflow Cursor recommandé (frontend owner)

| Phase | Mode Cursor | Action |
|-------|-------------|--------|
| Architecture | **Plan** (Shift+Tab) | Valider structure dossiers avant codegen |
| Feature | **Agent** | Un prompt §2–§8 à la fois, jamais tout d'un coup |
| Multi-fichiers | **Composer** (Ctrl+I) | MarkdownRenderer + CodeBlock + MessageItem ensemble |
| Intégration | **Agent** + @openapi.yaml | Backend connecté, prompt §10 |
| Bugfix build | **Agent** + linter | Corriger avant nouvelle feature |

**Règles d'or :**

1. **Un prompt = une feature verticalisée** (pas "fais toute l'app")
2. **Toujours @mentionner** le cahier des charges + types
3. **MSW d'abord**, backend ensuite — ne pas bloquer
4. **Commit** après chaque prompt réussi (`feat: sidebar canaux`)
5. **Pair sync** avec backend à H+2 (OpenAPI) et H+10 (WebSocket)

---

## 13. Prompt pitch équipe (optionnel)

```
Rédige un script pitch 3 minutes pour CommHQ (hackathon J.U.I.N 2026) :
- Problème : chat enterprise illisible pour le code
- Solution : CommHQ Markdown-first + Shiki
- Démo : incident API + résumé IA 3 phrases
- Stack : Spring Boot sécurisé + React
- Bonus IA : Spring AI côté backend

Ton professionnel, français, 400 mots max.
```

---

*Prompts v1.0 — CommHQ frontend · Backend Spring Boot par l'équipe backend*

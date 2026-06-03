# Prompt IA — Présentation PowerPoint CommHQ (Hackathon J.U.I.N 2026)

Ce document contient :
1. L'**outil IA idéal** recommandé (et les alternatives)
2. Un **prompt puissant prêt à copier-coller**
3. Des **variantes** selon l'outil choisi

---

## 1. Quel outil IA utiliser ?

| Objectif | Outil recommandé | Pourquoi |
|----------|------------------|----------|
| **Générer le deck complet (slides + design)** | **Gamma** (gamma.app) | Transforme un prompt en présentation designée et exportable en PPTX/PDF. Idéal hackathon. |
| Alternative tout-en-un | **Genspark AI Slides** / **Presentations.ai** | Génèrent aussi un deck visuel depuis un prompt. |
| Si vous voulez le contenu d'abord | **ChatGPT (GPT-5)** ou **Claude** | Génèrent un plan slide par slide + script orateur, à coller dans Gamma/PowerPoint. |
| Export PPTX natif Microsoft | **Copilot dans PowerPoint** | Si vous avez M365, génère directement dans PowerPoint. |

**Recommandation : Gamma.** Collez le prompt ci-dessous dans « Créer avec l'IA » → « Texte vers présentation », choisissez un thème sombre/tech, puis exportez en PowerPoint (.pptx).

---

## 2. LE PROMPT (à copier-coller dans Gamma / ChatGPT / Claude)

> Copiez tout le bloc ci-dessous tel quel.

```
Tu es un expert en pitch de hackathon et en design de présentations d'entreprise.
Crée une présentation PowerPoint professionnelle, percutante et visuelle pour
pitcher notre projet devant le jury du Hackathon Interuniversitaire J.U.I.N 2026
(Édition Cursor). Durée du pitch : 3 minutes. Langue : français.

CONTEXTE DU CONCOURS
- Hackathon dédié au prototypage rapide d'applications d'entreprise assisté par l'IDE Cursor.
- Objectif : livrer un MVP fonctionnel en 24h.
- BONUS clé du jury : jusqu'à +3 points pour une intégration IA concrète et fonctionnelle
  (pas juste une idée). Ce point doit être mis très en valeur.

NOTRE PROJET : CommHQ — Le Messager Technique Sécurisé (Thème 13)
- Concept : application de chat d'entreprise organisée par canaux thématiques
  (#backend, #incidents, #data...), avec rendu natif et propre du Markdown,
  des blocs de code et de la coloration syntaxique.
- Problème résolu : Slack/Teams affichent mal le code, les logs et la doc technique.
  Les équipes tech (dev, data, infra) perdent en lisibilité et en contexte.
- Cible : équipes techniques en entreprise.
- BONUS IA (différenciateur jury) : un bot de canal qui résume une discussion
  en exactement 3 phrases clés, pour que les managers rattrapent les décisions
  importantes en quelques secondes. Implémenté côté backend avec Spring AI.

STACK TECHNIQUE
- Frontend : React 19, Vite, TypeScript, Tailwind CSS, composants Radix/shadcn,
  TanStack Query, Zustand, react-markdown + Shiki (coloration syntaxique),
  WebSocket STOMP pour le temps réel.
- Backend : Spring Boot 3, Spring Security (JWT), Spring Data JPA + PostgreSQL,
  WebSocket/STOMP, et Spring AI pour le résumé intelligent.
- Méthode : développement piloté par l'IDE Cursor (Mode Plan, Composer, prompts
  structurés), contrat d'API OpenAPI figé tôt, mocks MSW pour avancer le frontend
  en parallèle du backend.

FONCTIONNALITÉS MVP (à montrer en démo)
1. Connexion sécurisée (JWT).
2. Navigation par canaux thématiques.
3. Messagerie en temps réel (WebSocket).
4. Rendu Markdown + blocs de code colorés (point fort visuel).
5. Bouton "Résumer le canal" → 3 phrases générées par l'IA (le moment WOW du pitch).

POURQUOI NOUS GAGNONS
- Différenciation claire : "Markdown-first / code-first" là où les concurrents sont génériques.
- Bonus IA réellement implémenté et démontrable en live.
- Exécution rapide grâce à une méthodologie Cursor maîtrisée (24h).
- Architecture propre et crédible "enterprise" (Spring Boot + sécurité).

STRUCTURE DES SLIDES (génère exactement ces slides, une idée par slide)
1. Titre : "CommHQ — Le Messager Technique Sécurisé" + sous-titre accrocheur + équipe + Thème 13.
2. Le Problème : le code et la technique sont illisibles dans les chats d'entreprise actuels.
3. La Solution : CommHQ, le chat pensé pour les équipes techniques (Markdown + code natif).
4. Démo / Captures : canaux, message avec bloc de code coloré, rendu Markdown.
5. La fonctionnalité IA bonus : le bot "Résumé en 3 phrases" (mettre en avant +3 pts jury).
6. Architecture technique : schéma Frontend (React) <-> Backend (Spring Boot) <-> IA + DB.
7. Stack & Méthode Cursor : comment on a livré vite (Mode Plan, Composer, mocks, OpenAPI).
8. Pourquoi CommHQ se démarque : 3 arguments forts (différenciation, IA concrète, exécution).
9. Roadmap / et après : threads, recherche sémantique RAG, intégrations.
10. Slide de clôture : logo, message final percutant, "Merci / Questions".

EXIGENCES DE DESIGN
- Style moderne, sombre, "tech/developer", accents en bleu/violet, typographie nette.
- Visuels : icônes, schéma d'architecture simple, encarts "blocs de code" stylisés.
- Texte concis : titres courts, 3 à 5 puces max par slide, pas de paragraphes longs.
- Pour chaque slide, ajoute aussi des NOTES ORATEUR (2-3 phrases) pour guider la présentation.
- Ton : confiant, orienté impact et démonstration, pas de jargon inutile.

Génère maintenant la présentation complète slide par slide, avec le titre de chaque
slide, le contenu (puces), une suggestion de visuel, et les notes orateur.
```

---

## 3. Variantes rapides

### Pour ChatGPT/Claude (obtenir d'abord un plan détaillé + script)

Ajoutez à la fin du prompt :

```
Donne le résultat sous forme de tableau : | N° | Titre slide | Puces | Visuel suggéré | Notes orateur |.
Puis génère un script de présentation orale de 3 minutes (environ 400 mots).
```

### Pour générer un PPTX par code (python-pptx)

Si vous préférez un fichier `.pptx` versionnable dans le repo, demandez :

```
Génère un script Python utilisant la librairie python-pptx qui crée le fichier
CommHQ-Pitch.pptx avec toutes les slides ci-dessus (titres, puces, notes orateur),
thème sombre, prêt à exécuter.
```

---

## 4. Checklist avant de présenter

- [ ] La slide IA (résumé 3 phrases) est mise en avant — c'est le bonus +3 pts.
- [ ] Une capture réelle de l'app (canal + bloc de code coloré) est intégrée.
- [ ] Le schéma d'architecture est lisible en 5 secondes.
- [ ] Le pitch tient en 3 minutes (répétition chronométrée).
- [ ] La démo live est prête (ou une vidéo de secours).

---

*Sources : [Cahier des charges](./Cahier%20des%20charges.md) · [Prompt Cursor](./Prompt.md) · [Guide officiel](./Guide%20Officiel%20du%20Hackathon%20J.U.I.N%202026%20-%20%C3%89dition%20Cursor%20V2.pdf)*

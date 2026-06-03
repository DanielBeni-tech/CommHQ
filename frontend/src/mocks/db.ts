import type {
  Channel,
  ChannelSummary,
  Invitation,
  Message,
  User,
  Workspace,
} from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ------------------------------ Users ------------------------------ */

export const currentUser: User = {
  id: "u_camille",
  name: "Camille Dubois",
  email: "camille@acme.dev",
  globalRole: "user",
  online: true,
};

const lina: User = {
  id: "u_lina",
  name: "Lina Marchetti",
  email: "lina@acme.dev",
  globalRole: "user",
  online: true,
};

const tom: User = {
  id: "u_tom",
  name: "Tom Nkosi",
  email: "tom@acme.dev",
  globalRole: "user",
  online: false,
};

const bot: User = {
  id: "u_bot",
  name: "Syntra Bot",
  email: "bot@syntra.ai",
  globalRole: "user",
  online: true,
};

export const users: User[] = [currentUser, lina, tom, bot];

/* --------------------------- Workspaces ---------------------------- */

export const workspaces: Workspace[] = [
  { id: "ws_acme", name: "Acme Corp", ownerId: currentUser.id, myRole: "moderator" },
  { id: "ws_side", name: "Side Project", ownerId: lina.id, myRole: "member" },
];

/* ---------------------------- Channels ----------------------------- */

export const channels: Channel[] = [
  {
    id: "ch_welcome",
    workspaceId: "ws_acme",
    name: "bienvenue",
    description: "Canal d'accueil de l'espace",
    isPrivate: false,
    isWelcome: true,
    createdAt: new Date("2026-05-01T08:00:00Z").toISOString(),
  },
  {
    id: "ch_backend",
    workspaceId: "ws_acme",
    name: "backend",
    description: "API NestJS, base de données, sécurité",
    isPrivate: false,
    createdAt: new Date("2026-05-01T08:05:00Z").toISOString(),
  },
  {
    id: "ch_incidents",
    workspaceId: "ws_acme",
    name: "incidents",
    description: "Suivi des incidents de production",
    isPrivate: true,
    createdAt: new Date("2026-05-01T08:10:00Z").toISOString(),
  },
  {
    id: "ch_design",
    workspaceId: "ws_acme",
    name: "design-system",
    description: "Tokens, composants, accessibilité",
    isPrivate: false,
    createdAt: new Date("2026-05-01T08:15:00Z").toISOString(),
  },
  {
    id: "ch_side_general",
    workspaceId: "ws_side",
    name: "general",
    description: "Discussions générales",
    isPrivate: false,
    isWelcome: true,
    createdAt: new Date("2026-05-02T09:00:00Z").toISOString(),
  },
];

/* ---------------------------- Messages ----------------------------- */

function msg(
  channelId: string,
  author: User,
  content: string,
  minutesAgo: number,
  pinned = false
): Message {
  return {
    id: uid("msg"),
    channelId,
    author,
    content,
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    pinned,
  };
}

export const messages: Message[] = [
  msg("ch_welcome", lina, "Bienvenue dans l'espace **Acme Corp** ! 🎉\n\nPrésentez-vous dans ce canal.", 600, true),
  msg("ch_welcome", currentUser, "Salut tout le monde, ravie de démarrer ici.", 580),

  msg(
    "ch_backend",
    tom,
    "J'ai branché l'auth JWT côté NestJS. Voici le guard :\n\n```typescript\n@Injectable()\nexport class JwtAuthGuard extends AuthGuard('jwt') {\n  canActivate(ctx: ExecutionContext) {\n    return super.canActivate(ctx);\n  }\n}\n```",
    240
  ),
  msg(
    "ch_backend",
    lina,
    "Top. Pensez à valider le payload avec `class-validator` :\n\n```typescript\nexport class CreateMessageDto {\n  @IsString()\n  @MaxLength(4000)\n  content: string;\n}\n```",
    232
  ),
  msg(
    "ch_backend",
    currentUser,
    "Décision : on stocke le **Markdown brut** en base et on sanitise au rendu côté client. On garde Shiki pour la coloration.",
    220,
    true
  ),
  msg(
    "ch_backend",
    tom,
    "Action : je crée l'endpoint `POST /channels/:id/summary` pour le résumé IA d'ici ce soir.",
    210
  ),

  msg(
    "ch_incidents",
    lina,
    "🚨 Incident en cours sur l'API paiements.\n\n```json\n{\n  \"status\": 502,\n  \"service\": \"payment-api\",\n  \"region\": \"eu-west-1\"\n}\n```",
    90,
    true
  ),
  msg("ch_incidents", currentUser, "Je regarde les logs. On dirait un timeout en cascade.", 85),
  msg(
    "ch_incidents",
    tom,
    "Checklist :\n- [x] Alerter l'équipe oncall\n- [x] Rollback `v2.3.1`\n- [ ] Post-mortem demain",
    80
  ),
  msg("ch_incidents", lina, "Rollback effectué, le service répond de nouveau. Décision : post-mortem programmé demain 10h.", 70),

  msg("ch_design", currentUser, "Palette validée : bleu messager `#2563EB` + vert en ligne `#059669`. Typo : IBM Plex Sans / JetBrains Mono.", 300),

  msg("ch_side_general", lina, "On démarre le side project ce week-end ?", 1440),
];

/* ----------------------------- Mutators ---------------------------- */

export function listWorkspaces(): Workspace[] {
  return [...workspaces];
}

export function createWorkspaceRecord(name: string): Workspace {
  const ws: Workspace = { id: uid("ws"), name, ownerId: currentUser.id, myRole: "moderator" };
  workspaces.push(ws);
  const welcome: Channel = {
    id: uid("ch"),
    workspaceId: ws.id,
    name: "bienvenue",
    description: "Canal d'accueil de l'espace",
    isPrivate: false,
    isWelcome: true,
    createdAt: new Date().toISOString(),
  };
  channels.push(welcome);
  messages.push(msg(welcome.id, currentUser, `Espace **${name}** créé. Bienvenue !`, 0, true));
  return ws;
}

export function listChannels(workspaceId: string): Channel[] {
  return channels.filter((c) => c.workspaceId === workspaceId);
}

export function createChannelRecord(input: {
  workspaceId: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
}): Channel {
  const channel: Channel = {
    id: uid("ch"),
    workspaceId: input.workspaceId,
    name: input.name.trim().toLowerCase().replace(/\s+/g, "-"),
    description: input.description,
    isPrivate: Boolean(input.isPrivate),
    createdAt: new Date().toISOString(),
  };
  channels.push(channel);
  return channel;
}

export function renameChannelRecord(channelId: string, name: string): Channel | undefined {
  const channel = channels.find((c) => c.id === channelId);
  if (channel) channel.name = name.trim().toLowerCase().replace(/\s+/g, "-");
  return channel;
}

export function deleteChannelRecord(channelId: string): void {
  const idx = channels.findIndex((c) => c.id === channelId);
  if (idx >= 0) channels.splice(idx, 1);
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].channelId === channelId) messages.splice(i, 1);
  }
}

export function listMessages(channelId: string): Message[] {
  return messages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addMessageRecord(channelId: string, content: string): Message {
  const message = msg(channelId, currentUser, content, 0);
  messages.push(message);
  return message;
}

export function editMessageRecord(messageId: string, content: string): Message | undefined {
  const message = messages.find((m) => m.id === messageId);
  if (message) {
    message.content = content;
    message.editedAt = new Date().toISOString();
  }
  return message;
}

export function deleteMessageRecord(messageId: string): Message | undefined {
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return undefined;
  const [removed] = messages.splice(idx, 1);
  return removed;
}

export function setPinnedRecord(messageId: string, pinned: boolean): Message | undefined {
  const message = messages.find((m) => m.id === messageId);
  if (message) message.pinned = pinned;
  return message;
}

export function createInvitationRecord(workspaceId: string): Invitation {
  const ws = workspaces.find((w) => w.id === workspaceId);
  return {
    token: uid("inv"),
    workspaceId,
    workspaceName: ws?.name ?? "Espace de travail",
  };
}

export function resolveInvitationRecord(token: string): Invitation {
  return {
    token,
    workspaceId: workspaces[0].id,
    workspaceName: workspaces[0].name,
  };
}

/** Mock LLM : résumé déterministe en 3 phrases à partir des messages. */
export function summarizeRecord(channelId: string): ChannelSummary {
  const channelMessages = listMessages(channelId);
  const decisions = channelMessages.filter((m) => /décision/i.test(m.content));
  const actions = channelMessages.filter((m) => /action|\[ \]|\[x\]/i.test(m.content));
  const channel = channels.find((c) => c.id === channelId);

  const sentences: string[] = [];
  sentences.push(
    `La discussion du canal #${channel?.name ?? channelId} porte sur ${channelMessages.length} messages échangés par l'équipe technique.`
  );
  sentences.push(
    decisions.length
      ? `Décision clé : ${stripMd(decisions[decisions.length - 1].content)}`
      : "Aucune décision formelle n'a été prise, les échanges restent exploratoires."
  );
  sentences.push(
    actions.length
      ? `Action à suivre : ${stripMd(actions[actions.length - 1].content)}`
      : "Aucune action explicite n'est en attente pour le moment."
  );

  return {
    channelId,
    summary: sentences.map((s) => truncate(s, 180)).join(" "),
    messageCount: channelMessages.length,
    generatedAt: new Date().toISOString(),
  };
}

function stripMd(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_`#>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

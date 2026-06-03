import { http, HttpResponse, delay } from "msw";

import { API_URL } from "@/api/client";
import * as db from "@/mocks/db";

const url = (path: string) => `${API_URL}${path}`;
const TOKEN = "mock-jwt-token";

export const handlers = [
  /* ----------------------------- Auth ----------------------------- */
  http.post(url("/auth/login"), async () => {
    await delay(200);
    return HttpResponse.json({ token: TOKEN, user: db.currentUser });
  }),

  http.post(url("/auth/register"), async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { name?: string };
    return HttpResponse.json({
      token: TOKEN,
      user: { ...db.currentUser, name: body.name ?? db.currentUser.name },
    });
  }),

  http.get(url("/invitations/:token"), ({ params }) =>
    HttpResponse.json(db.resolveInvitationRecord(String(params.token)))
  ),

  /* -------------------------- Workspaces -------------------------- */
  http.get(url("/workspaces"), () => HttpResponse.json(db.listWorkspaces())),

  http.post(url("/workspaces"), async ({ request }) => {
    const { name } = (await request.json()) as { name: string };
    return HttpResponse.json(db.createWorkspaceRecord(name), { status: 201 });
  }),

  http.post(url("/workspaces/:id/invitations"), ({ params }) =>
    HttpResponse.json(db.createInvitationRecord(String(params.id)), { status: 201 })
  ),

  http.get(url("/workspaces/:id/channels"), ({ params }) =>
    HttpResponse.json(db.listChannels(String(params.id)))
  ),

  http.post(url("/workspaces/:id/channels"), async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      isPrivate?: boolean;
    };
    return HttpResponse.json(
      db.createChannelRecord({ workspaceId: String(params.id), ...body }),
      { status: 201 }
    );
  }),

  /* --------------------------- Channels --------------------------- */
  http.patch(url("/channels/:id"), async ({ params, request }) => {
    const { name } = (await request.json()) as { name: string };
    const channel = db.renameChannelRecord(String(params.id), name);
    return channel
      ? HttpResponse.json(channel)
      : new HttpResponse(null, { status: 404 });
  }),

  http.delete(url("/channels/:id"), ({ params }) => {
    db.deleteChannelRecord(String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  /* --------------------------- Messages --------------------------- */
  http.get(url("/channels/:id/messages"), async ({ params }) => {
    await delay(150);
    return HttpResponse.json(db.listMessages(String(params.id)));
  }),

  http.post(url("/channels/:id/messages"), async ({ params, request }) => {
    const { content } = (await request.json()) as { content: string };
    return HttpResponse.json(
      db.addMessageRecord(String(params.id), content),
      { status: 201 }
    );
  }),

  http.patch(url("/messages/:id"), async ({ params, request }) => {
    const { content } = (await request.json()) as { content: string };
    const message = db.editMessageRecord(String(params.id), content);
    return message
      ? HttpResponse.json(message)
      : new HttpResponse(null, { status: 404 });
  }),

  http.delete(url("/messages/:id"), ({ params }) => {
    db.deleteMessageRecord(String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(url("/messages/:id/pin"), ({ params }) => {
    const message = db.setPinnedRecord(String(params.id), true);
    return message
      ? HttpResponse.json(message)
      : new HttpResponse(null, { status: 404 });
  }),

  http.post(url("/messages/:id/unpin"), ({ params }) => {
    const message = db.setPinnedRecord(String(params.id), false);
    return message
      ? HttpResponse.json(message)
      : new HttpResponse(null, { status: 404 });
  }),

  /* ----------------------------- IA ------------------------------- */
  http.post(url("/channels/:id/summary"), async ({ params }) => {
    await delay(1200);
    return HttpResponse.json(db.summarizeRecord(String(params.id)));
  }),
];

import { useCallback, useEffect, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowDown, Hash, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MessageItem } from "@/components/chat/MessageItem";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type { Channel, Message, User } from "@/types";

interface MessageListProps {
  channel: Channel;
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
  canPin: boolean;
  typingUsers: User[];
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onTogglePin: (messageId: string, pinned: boolean) => void;
}

/** Formate une date en séparateur lisible (Aujourd'hui, Hier, ou date longue). */
function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return "Aujourd'hui";
  if (isSameDay(d, yesterday)) return "Hier";
  return format(d, "EEEE d MMMM yyyy", { locale: fr });
}

export function MessageList({
  channel,
  messages,
  isLoading,
  currentUserId,
  canPin,
  typingUsers,
  onEdit,
  onDelete,
  onTogglePin,
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  /* Auto-scroll vers le bas à l'arrivée de nouveaux messages. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const distanceFromBottom = vp.scrollHeight - vp.scrollTop - vp.clientHeight;
    /* Ne force le scroll que si on est déjà proche du bas (<150 px). */
    if (distanceFromBottom < 150) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, typingUsers.length]);

  /* Affiche le bouton « retour en bas » quand on remonte. */
  const handleScroll = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const distanceFromBottom = vp.scrollHeight - vp.scrollTop - vp.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);
  }, []);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  /* Construction de la liste avec séparateurs de dates intercalés. */
  const items: Array<{ kind: "separator"; label: string } | { kind: "message"; message: Message }> = [];
  let lastDate: string | null = null;

  for (const message of messages) {
    const day = message.createdAt.slice(0, 10);
    if (day !== lastDate) {
      items.push({ kind: "separator", label: dateSeparatorLabel(message.createdAt) });
      lastDate = day;
    }
    items.push({ kind: "message", message });
  }

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Zone de défilement avec scrollbar toujours visible */}
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col overflow-y-scroll scrollbar-thin pr-1"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="flex flex-col gap-0.5 p-4">
          {/* En-tête du canal */}
          <div className="mb-4 border-b pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Hash className="h-6 w-6" />
            </div>
            <h2 className="mt-2 text-xl font-bold">Bienvenue dans #{channel.name}</h2>
            <p className="text-sm text-muted-foreground">
              {channel.description ?? "Début de la conversation."}
            </p>
          </div>

          {/* Messages avec séparateurs de dates */}
          {items.map((item, idx) => {
            if (item.kind === "separator") {
              return (
                <div
                  key={`sep-${idx}`}
                  className="my-3 flex items-center gap-3"
                  role="separator"
                  aria-label={item.label}
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="rounded-full border bg-background px-3 py-0.5 text-xs text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              );
            }
            return (
              <MessageItem
                key={item.message.id}
                message={item.message}
                isOwn={item.message.author.id === currentUserId}
                canPin={canPin}
                onEdit={(content) => onEdit(item.message.id, content)}
                onDelete={() => onDelete(item.message.id)}
                onTogglePin={() => onTogglePin(item.message.id, !item.message.pinned)}
              />
            );
          })}

          <TypingIndicator users={typingUsers} />
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Bouton flottant « Retour en bas » */}
      {showScrollBtn && (
        <Button
          onClick={scrollToBottom}
          size="sm"
          variant="secondary"
          className="absolute bottom-4 right-5 z-20 gap-1.5 rounded-full shadow-lg"
          aria-label="Aller en bas"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          En bas
        </Button>
      )}
    </div>
  );
}

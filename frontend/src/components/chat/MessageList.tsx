import { useEffect, useRef } from "react";
import { Hash, Loader2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUsers.length]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-0.5 p-4">
        <div className="mb-4 border-b pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Hash className="h-6 w-6" />
          </div>
          <h2 className="mt-2 text-xl font-bold">Bienvenue dans #{channel.name}</h2>
          <p className="text-sm text-muted-foreground">
            {channel.description ?? "Début de la conversation."}
          </p>
        </div>

        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.author.id === currentUserId}
            canPin={canPin}
            onEdit={(content) => onEdit(message.id, content)}
            onDelete={() => onDelete(message.id)}
            onTogglePin={() => onTogglePin(message.id, !message.pinned)}
          />
        ))}

        <TypingIndicator users={typingUsers} />
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

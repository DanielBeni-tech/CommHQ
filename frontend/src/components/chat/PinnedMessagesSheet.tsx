import { Pin } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { formatMessageTime } from "@/lib/format";
import type { Message } from "@/types";

export function PinnedMessagesSheet({
  open,
  onOpenChange,
  messages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pin className="h-4 w-4" /> Messages épinglés
          </SheetTitle>
          <SheetDescription>
            Les messages importants mis en avant par les modérateurs.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-6rem)] px-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun message épinglé.
            </p>
          ) : (
            <div className="space-y-3 pb-6">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{m.author.name}</span>
                    {formatMessageTime(m.createdAt)}
                  </div>
                  <MarkdownRenderer content={m.content} />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

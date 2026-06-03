import { useState } from "react";
import { Check, MoreHorizontal, Pencil, Pin, PinOff, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMessageTime, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import type { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  canPin: boolean;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function MessageItem({
  message,
  isOwn,
  canPin,
  onEdit,
  onDelete,
  onTogglePin,
}: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasActions = isOwn || canPin;

  function saveEdit() {
    const next = draft.trim();
    if (next && next !== message.content) onEdit(next);
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50",
        message.pinned && "bg-primary/5"
      )}
    >
      <Avatar className="mt-0.5 h-9 w-9">
        <AvatarFallback>{initials(message.author.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{message.author.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(message.createdAt)}
          </span>
          {message.editedAt && (
            <span className="text-xs text-muted-foreground">(modifié)</span>
          )}
          {message.pinned && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Pin className="h-3 w-3" /> épinglé
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" /> Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" /> Annuler
              </Button>
            </div>
          </div>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>

      {hasActions && !editing && (
        <div className="absolute right-2 top-1 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Actions sur le message">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canPin && (
                <DropdownMenuItem onClick={onTogglePin}>
                  {message.pinned ? (
                    <>
                      <PinOff className="h-4 w-4" /> Désépingler
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" /> Épingler
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {isOwn && (
                <DropdownMenuItem onClick={() => { setDraft(message.content); setEditing(true); }}>
                  <Pencil className="h-4 w-4" /> Modifier
                </DropdownMenuItem>
              )}
              {isOwn && (
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" /> Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

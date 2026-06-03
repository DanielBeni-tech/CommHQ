import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, Lock, Pencil, Pin, Settings, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { RenameChannelDialog } from "@/components/channel/RenameChannelDialog";
import { useDeleteChannel } from "@/hooks/useChannels";
import type { Channel } from "@/types";

interface ChannelHeaderProps {
  channel: Channel;
  pinnedCount: number;
  canManage: boolean;
  summarizing: boolean;
  onSummarize: () => void;
  onShowPinned: () => void;
}

export function ChannelHeader({
  channel,
  pinnedCount,
  canManage,
  summarizing,
  onSummarize,
  onShowPinned,
}: ChannelHeaderProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutateAsync: removeChannel } = useDeleteChannel(channel.workspaceId);
  const navigate = useNavigate();

  async function handleDelete() {
    try {
      await removeChannel(channel.id);
      toast.success(`Canal #${channel.name} supprimé.`);
      navigate("/", { replace: true });
    } catch {
      toast.error("Impossible de supprimer le canal.");
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/40 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {channel.isPrivate ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            <Hash className="h-3.5 w-3.5" />
          )}
        </span>
        <h1 className="truncate text-[15px] font-semibold">{channel.name}</h1>
        {channel.description && (
          <>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <span className="hidden truncate text-sm text-muted-foreground md:inline">
              {channel.description}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onShowPinned} className="gap-1.5">
          <Pin className="h-4 w-4" />
          <span className="hidden md:inline">Épinglés</span>
          {pinnedCount > 0 && (
            <Badge variant="warning" className="px-1.5 py-0 text-[10px] leading-4">
              {pinnedCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="accent"
          size="sm"
          onClick={onSummarize}
          disabled={summarizing}
          className="gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">
            {summarizing ? "Résumé en cours…" : "Résumer le canal"}
          </span>
        </Button>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Gérer le canal">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="h-4 w-4" /> Renommer
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={channel.isWelcome}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <RenameChannelDialog
        channel={channel}
        workspaceId={channel.workspaceId}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer #{channel.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les messages de ce canal seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

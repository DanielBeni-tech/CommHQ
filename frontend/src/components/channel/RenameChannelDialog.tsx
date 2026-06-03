import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRenameChannel } from "@/hooks/useChannels";
import type { Channel } from "@/types";

export function RenameChannelDialog({
  channel,
  workspaceId,
  open,
  onOpenChange,
}: {
  channel: Channel;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(channel.name);
  const { mutateAsync, isPending } = useRenameChannel(workspaceId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await mutateAsync({ channelId: channel.id, name: name.trim() });
      toast.success("Canal renommé.");
      onOpenChange(false);
    } catch {
      toast.error("Impossible de renommer le canal.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Renommer le canal</DialogTitle>
          </DialogHeader>
          <div className="my-4 space-y-2">
            <Label htmlFor="rename">Nouveau nom</Label>
            <Input
              id="rename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

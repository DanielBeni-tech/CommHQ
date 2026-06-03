import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateChannel } from "@/hooks/useChannels";

export function CreateChannelDialog({
  workspaceId,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const { mutateAsync, isPending } = useCreateChannel(workspaceId);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const channel = await mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      });
      toast.success(`Canal #${channel.name} créé.`);
      setName("");
      setDescription("");
      setIsPrivate(false);
      onOpenChange(false);
      navigate(`/channels/${channel.id}`);
    } catch {
      toast.error("Impossible de créer le canal.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Créer un canal</DialogTitle>
            <DialogDescription>
              Organisez les discussions par thématique.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ch-name">Nom</Label>
              <Input
                id="ch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. backend"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ch-desc">Description (optionnel)</Label>
              <Input
                id="ch-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="À quoi sert ce canal ?"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-primary"
              />
              Canal privé (accès restreint)
            </label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer le canal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

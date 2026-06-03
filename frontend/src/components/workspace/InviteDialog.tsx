import { useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInvitation } from "@/api/services";

export function InviteDialog({
  workspaceId,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLink(null);
    createInvitation(workspaceId)
      .then((inv) => setLink(`${window.location.origin}/register?invite=${inv.token}`))
      .catch(() => toast.error("Impossible de générer l'invitation."))
      .finally(() => setLoading(false));
  }, [open, workspaceId]);

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien d'invitation copié.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter des membres</DialogTitle>
          <DialogDescription>
            Partagez ce lien d'invitation pour rejoindre l'espace.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex items-center gap-2">
          {loading ? (
            <div className="flex h-9 w-full items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Génération du lien...
            </div>
          ) : (
            <>
              <Input readOnly value={link ?? ""} className="font-mono text-xs" />
              <Button size="icon" onClick={copy} aria-label="Copier le lien">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

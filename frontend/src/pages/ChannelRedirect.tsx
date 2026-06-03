import { Navigate } from "react-router-dom";
import { Hash, Loader2 } from "lucide-react";

import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useChannels } from "@/hooks/useChannels";

export function ChannelRedirect() {
  const { activeWorkspaceId, isLoading: wsLoading } = useWorkspaces();
  const { data: channels, isLoading } = useChannels(activeWorkspaceId);

  if (wsLoading || isLoading || !activeWorkspaceId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (channels && channels.length > 0) {
    return <Navigate to={`/channels/${channels[0].id}`} replace />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Hash className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">Aucun canal pour le moment</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Créez votre premier canal dans la barre latérale pour démarrer la conversation.
      </p>
    </div>
  );
}

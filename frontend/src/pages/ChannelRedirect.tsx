import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

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
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
      <p className="text-sm">Aucun canal. Créez-en un pour démarrer la conversation.</p>
    </div>
  );
}

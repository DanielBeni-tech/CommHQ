import { useEffect } from "react";

import { realtime } from "@/realtime/client";
import { useAuth } from "@/hooks/useAuth";

/** Connecte le client temps réel tant que l'utilisateur est authentifié. */
export function useRealtimeConnection() {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    realtime.connect(token);
    return () => realtime.disconnect();
  }, [isAuthenticated, token]);
}

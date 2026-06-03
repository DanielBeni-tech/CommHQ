import { Outlet } from "react-router-dom";

import { WorkspaceRail } from "@/components/layout/WorkspaceRail";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { useRealtimeConnection } from "@/hooks/useRealtimeConnection";

export function AppLayout() {
  useRealtimeConnection();

  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceRail />
      <ChannelSidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from "react";
import { MessageSquareCode, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { useWorkspaces } from "@/hooks/useWorkspaces";

export function WorkspaceRail() {
  const { data: workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <nav
      aria-label="Espaces de travail"
      className="relative flex w-[68px] shrink-0 flex-col items-center gap-2 bg-rail py-3"
    >
      {/* Logo / marque */}
      <div
        aria-hidden
        className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
      >
        <MessageSquareCode className="h-5 w-5" />
      </div>
      <div
        aria-hidden
        className="mb-1 h-px w-8 rounded-full bg-white/10"
      />

      {workspaces?.map((ws) => {
        const active = ws.id === activeWorkspaceId;
        return (
          <Tooltip key={ws.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveWorkspace(ws.id)}
                aria-label={ws.name}
                aria-current={active}
                className={cn(
                  "group/ws relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-150 hover:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer",
                  active
                    ? "rounded-xl bg-primary text-primary-foreground"
                    : "bg-sidebar-accent text-sidebar-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {/* Barre de sélection style Discord/Slack */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-0.5 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-white transition-all duration-200",
                    active ? "h-7" : "h-0 group-hover/ws:h-4"
                  )}
                />
                <span className="font-mono">{initials(ws.name)}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{ws.name}</TooltipContent>
          </Tooltip>
        );
      })}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setCreateOpen(true)}
            aria-label="Créer un espace de travail"
            className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-sidebar-accent text-success transition-all duration-150 hover:rounded-xl hover:bg-success hover:text-success-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/60 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Nouvel espace</TooltipContent>
      </Tooltip>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </nav>
  );
}

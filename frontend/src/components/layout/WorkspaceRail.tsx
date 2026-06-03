import { useState } from "react";
import { Plus } from "lucide-react";

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
      className="flex w-16 shrink-0 flex-col items-center gap-2 bg-rail py-3"
    >
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
                  "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold transition-all hover:rounded-xl cursor-pointer",
                  active
                    ? "rounded-xl bg-primary text-primary-foreground"
                    : "bg-sidebar-accent text-sidebar-foreground hover:bg-primary/80 hover:text-primary-foreground"
                )}
              >
                {initials(ws.name)}
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
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sidebar-accent text-success transition-all hover:rounded-xl hover:bg-success hover:text-success-foreground cursor-pointer"
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

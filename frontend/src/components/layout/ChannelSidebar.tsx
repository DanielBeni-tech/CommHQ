import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, Hash, Loader2, Lock, Plus, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoleBadge } from "@/components/common/RoleBadge";
import { CreateChannelDialog } from "@/components/channel/CreateChannelDialog";
import { InviteDialog } from "@/components/workspace/InviteDialog";
import { UserCard } from "@/components/layout/UserCard";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useChannels } from "@/hooks/useChannels";
import { usePermissions } from "@/hooks/usePermissions";

export function ChannelSidebar() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspaces();
  const { data: channels, isLoading } = useChannels(activeWorkspaceId);
  const { canManageChannels, canInvite } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* En-tête de l'espace */}
      <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sidebar-foreground">
            <h2 className="truncate text-[15px] font-semibold leading-tight">
              {activeWorkspace?.name ?? "—"}
            </h2>
            <ChevronDown className="h-3.5 w-3.5 text-sidebar-muted" />
          </div>
          {activeWorkspace && (
            <div className="mt-1.5">
              <RoleBadge role={activeWorkspace.myRole} />
            </div>
          )}
        </div>
        {canInvite && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setInviteOpen(true)}
                aria-label="Inviter des membres"
                className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Inviter des membres</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Section canaux */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
          Canaux
        </span>
        {canManageChannels && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCreateOpen(true)}
                aria-label="Créer un canal"
                className="rounded-md p-1 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Créer un canal</TooltipContent>
          </Tooltip>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-0.5 px-2 pb-3">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mx-2 my-1 h-7 bg-sidebar-accent/60" />
            ))}
          {channels?.map((channel) => (
            <NavLink
              key={channel.id}
              to={`/channels/${channel.id}`}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[14px] transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                    />
                  )}
                  {channel.isPrivate ? (
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Hash className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </>
              )}
            </NavLink>
          ))}
          {!isLoading && channels?.length === 0 && (
            <p className="px-3 py-3 text-sm text-sidebar-muted">
              Aucun canal pour le moment.
            </p>
          )}
        </nav>
      </ScrollArea>

      <UserCard />

      {activeWorkspaceId && (
        <>
          <CreateChannelDialog
            workspaceId={activeWorkspaceId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
          <InviteDialog
            workspaceId={activeWorkspaceId}
            open={inviteOpen}
            onOpenChange={setInviteOpen}
          />
        </>
      )}

      {isLoading && (
        <span className="sr-only">
          <Loader2 /> Chargement
        </span>
      )}
    </aside>
  );
}

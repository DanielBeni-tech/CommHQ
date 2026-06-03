import { useNavigate } from "react-router-dom";
import { LogOut, MoreVertical } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { initials } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export function UserCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-2.5 border-t border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9 ring-2 ring-sidebar">
          <AvatarFallback className="bg-primary/25 font-mono text-[13px] font-semibold text-sidebar-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success"
        />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
          {user.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-sidebar-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          En ligne
        </p>
      </div>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Menu utilisateur"
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[14rem]">
          <DropdownMenuItem disabled className="text-xs">
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { Crown, Shield, User as UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "@/types";

export function RoleBadge({ role }: { role: WorkspaceRole }) {
  if (role === "moderator") {
    return (
      <Badge variant="default" className="gap-1">
        <Crown className="h-3 w-3" />
        Modérateur
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <UserIcon className="h-3 w-3" />
      Membre
    </Badge>
  );
}

export function AdminBadge() {
  return (
    <Badge variant="destructive" className="gap-1">
      <Shield className="h-3 w-3" />
      Admin
    </Badge>
  );
}

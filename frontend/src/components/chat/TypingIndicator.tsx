import type { User } from "@/types";

export function TypingIndicator({ users }: { users: User[] }) {
  if (users.length === 0) return null;

  const label =
    users.length === 1
      ? `${users[0].name} est en train d'écrire`
      : `${users.length} personnes écrivent`;

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"
      aria-live="polite"
    >
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      {label}…
    </div>
  );
}

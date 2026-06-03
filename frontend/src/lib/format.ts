import { format, formatRelative, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "HH:mm", { locale: fr });
  if (isYesterday(date)) return `hier ${format(date, "HH:mm", { locale: fr })}`;
  return format(date, "d MMM HH:mm", { locale: fr });
}

export function formatFullDate(iso: string): string {
  return formatRelative(new Date(iso), new Date(), { locale: fr });
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

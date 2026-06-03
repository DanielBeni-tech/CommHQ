import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFullDate } from "@/lib/format";
import type { ChannelSummary } from "@/types";

interface SummarizePanelProps {
  loading: boolean;
  summary: ChannelSummary | null;
  error: boolean;
  onClose: () => void;
}

export function SummarizePanel({ loading, summary, error, onClose }: SummarizePanelProps) {
  return (
    <div className="border-b bg-accent/5 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent">
          <Sparkles className="h-4 w-4" />
          Résumé IA — 3 phrases clés
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Fermer le résumé">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-2 text-sm">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {error && !loading && (
          <p className="text-destructive">
            Le résumé n'a pas pu être généré. Réessayez dans un instant.
          </p>
        )}
        {summary && !loading && (
          <>
            <p className="leading-relaxed">{summary.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Généré par IA · {summary.messageCount} messages analysés ·{" "}
              {formatFullDate(summary.generatedAt)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

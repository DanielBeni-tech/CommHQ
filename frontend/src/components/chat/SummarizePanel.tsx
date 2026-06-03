import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFullDate } from "@/lib/format";
import type { ChannelSummary } from "@/types";

interface SummarizePanelProps {
  loading: boolean;
  summary: ChannelSummary | null;
  error: boolean;
  onRefresh: () => void;
}

/**
 * Barre fixe permanente sous le header du canal.
 * Affiche toujours le dernier résumé IA (ou un état d'invitation à en générer un).
 */
export function SummarizePanel({ loading, summary, error, onRefresh }: SummarizePanelProps) {
  return (
    <div className="z-10 shrink-0 border-b border-accent/15 bg-accent-soft/80 px-4 py-2.5 dark:bg-accent-soft">
      <div className="flex items-center gap-3">
        {/* Pastille + label IA */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.1em] text-accent sm:inline">
            Résumé IA
          </span>
        </div>

        {/* Contenu */}
        <div className="min-w-0 flex-1 text-sm">
          {loading && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-3 w-full max-w-lg" />
                <Skeleton className="h-3 w-4/5 max-w-md" />
              </div>
            </div>
          )}

          {error && !loading && (
            <span className="text-xs text-destructive">
              Génération échouée — cliquez sur actualiser.
            </span>
          )}

          {!summary && !loading && !error && (
            <span className="text-xs text-muted-foreground">
              Cliquez sur <strong className="text-accent">Actualiser</strong> pour obtenir
              un résumé des décisions clés de ce canal.
            </span>
          )}

          {summary && !loading && (
            <span className="leading-snug text-foreground">
              {summary.summary}
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                · {summary.messageCount} msg · {formatFullDate(summary.generatedAt)}
              </span>
            </span>
          )}
        </div>

        {/* Bouton refresh */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Actualiser le résumé IA"
          className="shrink-0 gap-1.5 text-xs text-accent hover:bg-accent/15 hover:text-accent"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>
    </div>
  );
}

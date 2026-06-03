import { MessageSquareCode } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-rail p-10 text-rail-foreground lg:flex">
        <div className="flex items-center gap-2">
          <MessageSquareCode className="h-6 w-6 text-primary" />
          <span className="font-mono text-lg font-bold tracking-tight text-white">
            CommHQ
          </span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Le messager technique des équipes qui codent.
          </h1>
          <p className="max-w-md text-rail-foreground">
            Canaux thématiques, rendu Markdown et coloration syntaxique de qualité
            éditeur, et un assistant IA qui résume vos discussions en 3 phrases.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 font-mono text-xs text-rail-foreground/80">
            <span className="rounded-md bg-white/5 px-2 py-1">Temps réel</span>
            <span className="rounded-md bg-white/5 px-2 py-1">Markdown + code</span>
            <span className="rounded-md bg-white/5 px-2 py-1">Résumé IA</span>
          </div>
        </div>
        <p className="font-mono text-xs text-rail-foreground/60">
          Hackathon J.U.I.N 2026 — Thème 13
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

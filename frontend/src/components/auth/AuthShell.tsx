import { Hash, MessageSquareCode, Shield, Sparkles } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-rail text-rail-foreground lg:flex lg:flex-col lg:justify-between lg:p-10">
        {/* Décor géométrique discret, sans gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full"
          style={{ backgroundColor: "color-mix(in oklab, var(--primary) 14%, transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full"
          style={{ backgroundColor: "color-mix(in oklab, var(--accent) 12%, transparent)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          >
            <MessageSquareCode className="h-5 w-5" />
          </span>
          <span className="font-mono text-lg font-bold tracking-tight text-white">
            Syntra
          </span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-[2.6rem]">
            Le messager technique<br />
            des équipes qui <span className="text-primary">codent</span>.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-rail-foreground/85">
            Canaux thématiques, rendu Markdown et coloration syntaxique de qualité
            éditeur, et un assistant IA qui résume vos discussions en 3 phrases.
          </p>

          <ul className="grid max-w-md gap-2.5 pt-2 text-sm">
            <FeatureRow
              icon={<Hash className="h-3.5 w-3.5" />}
              label="Canaux temps réel"
              hint="Markdown · code · réactions"
            />
            <FeatureRow
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Résumé IA en 3 phrases"
              hint="Rattrapez un canal en 5 secondes"
              tone="accent"
            />
            <FeatureRow
              icon={<Shield className="h-3.5 w-3.5" />}
              label="Sécurité & rôles"
              hint="Admin · modérateur · membre"
              tone="success"
            />
          </ul>
        </div>

        <p className="relative font-mono text-xs text-rail-foreground/55">
          Hackathon J.U.I.N 2026 — Thème 13
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  label,
  hint,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  tone?: "primary" | "accent" | "success";
}) {
  const toneColor =
    tone === "accent"
      ? "var(--accent)"
      : tone === "success"
        ? "var(--success)"
        : "var(--primary)";
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md"
        style={{
          backgroundColor: `color-mix(in oklab, ${toneColor} 22%, transparent)`,
          color: toneColor,
        }}
      >
        {icon}
      </span>
      <span className="leading-tight">
        <span className="block font-medium text-white">{label}</span>
        <span className="block text-xs text-rail-foreground/70">{hint}</span>
      </span>
    </li>
  );
}

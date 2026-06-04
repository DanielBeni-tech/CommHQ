import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { register, resolveInvitation } from "@/api/services";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite") ?? undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteToken) return;
    resolveInvitation(inviteToken)
      .then((inv) => setWorkspaceName(inv.workspaceName))
      .catch(() => setWorkspaceName(null));
  }, [inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await register({
        name,
        email,
        password,
        invitationToken: inviteToken,
      });
      setAuth(token, user);
      navigate("/", { replace: true });
    } catch (err) {
      // Affiche le détail renvoyé par le backend (ex. mot de passe trop faible,
      // email déjà utilisé, …) pour faciliter la correction par l'utilisateur.
      const detail =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const msg = Array.isArray(detail) ? detail.join(" ") : detail;
      toast.error(msg ?? "Échec de l'inscription. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="space-y-7">
        <div className="space-y-1.5">
          <h2 className="text-[1.7rem] font-bold leading-tight tracking-tight">
            Créer un compte
          </h2>
          <p className="text-sm text-muted-foreground">
            Configurez votre profil pour rejoindre Syntra.
          </p>
        </div>

        {inviteToken && (
          <div className="flex items-center gap-2.5 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-xs uppercase tracking-wide text-primary">Invitation</span>
              <span className="block font-medium text-foreground">
                Rejoindre {workspaceName ?? "un espace de travail"}
              </span>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom affiché</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              pattern="^(?=.*[A-Za-z])(?=.*\d).+$"
              title="Au moins 8 caractères, avec une lettre et un chiffre."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              8 caractères minimum, avec au moins une lettre et un chiffre.
            </p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer mon compte
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { login } from "@/api/services";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("camille@acme.dev");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      setAuth(token, user);
      navigate("/", { replace: true });
    } catch (err) {
      const detail =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const msg = Array.isArray(detail) ? detail.join(" ") : detail;
      toast.error(msg ?? "Échec de la connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="space-y-7">
        <div className="space-y-1.5">
          <h2 className="text-[1.7rem] font-bold leading-tight tracking-tight">
            Bon retour.
          </h2>
          <p className="text-sm text-muted-foreground">
            Accédez à vos espaces de travail Syntra.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
        <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Démo : <span className="font-mono">camille@acme.dev</span> ·{" "}
          <span className="font-mono">demo1234</span>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

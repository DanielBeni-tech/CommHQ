/**
 * Centralise la lecture des variables d'environnement.
 *
 * Tous les modules NestJS qui ont besoin d'une variable d'env DOIVENT passer par
 * ConfigService (injection de dépendance) plutôt que par `process.env` directement.
 * Cela permet de typer la configuration et de la tester plus facilement.
 */
export interface AppConfig {
  port: number;
  corsOrigin: string;
  mongodbUri: string;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  invitations: {
    ttlHours: number;
    frontendUrl: string;
  };
  ai: {
    provider: 'mock' | 'openai';
    openaiApiKey: string;
    openaiModel: string;
  };
}

/**
 * Récupère une variable d'environnement obligatoire.
 * Lève une erreur claire si elle est manquante (utile au démarrage).
 */
function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example pour la liste complète.`,
    );
  }
  return value;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  mongodbUri: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/commhq'),
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  invitations: {
    ttlHours: parseInt(process.env.INVITATION_TTL_HOURS ?? '72', 10),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },
  ai: {
    provider: (process.env.AI_PROVIDER as 'mock' | 'openai') ?? 'mock',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
});

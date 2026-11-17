// Server-only settings check. Returns French, value-free descriptions of missing settings
// so a self-hosted install shows what to fix instead of a generic error page.
export function configProblems(): string[] {
  const env = process.env;
  const problems: string[] = [];
  const secret = env["SESSION_SECRET"] ?? "";
  if (!secret) problems.push("SESSION_SECRET est vide ou absent du fichier .env.");
  else if (secret.length < 32) problems.push("SESSION_SECRET est trop court (32 caractères minimum, utilise : openssl rand -hex 32).");
  if (!env["SITE_PASSWORD"]) problems.push("SITE_PASSWORD est vide ou absent du fichier .env.");
  if (!env["ADMIN_PASSWORD"]) problems.push("ADMIN_PASSWORD est vide ou absent du fichier .env.");
  return problems;
}

/** Turns a raw PostgreSQL/driver error into a French hint without exposing connection details. */
export function databaseHint(error: unknown): string {
  const e = error as { code?: string; message?: string };
  const code = e?.code ?? "";
  const msg = String(e?.message ?? "");
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT")
    return "Base de données : connexion impossible. Vérifie que PostgreSQL tourne et l'adresse dans DATABASE_URL.";
  if (code === "28P01" || /password authentication/i.test(msg))
    return "Base de données : mot de passe refusé. Vérifie le mot de passe dans DATABASE_URL.";
  if (code === "3D000") return "Base de données : la base indiquée dans DATABASE_URL n'existe pas.";
  if (code === "42P01") return "Base de données : les tables n'existent pas. Lance deploy/schema.sql (étape 5 du guide).";
  if (code === "42501") return "Base de données : accès refusé aux tables. Lance deploy/schema.sql avec l'utilisateur de DATABASE_URL.";
  return "Base de données : erreur inattendue. Regarde « pm2 logs cercle ».";
}

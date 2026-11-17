// Reads the server settings itself so they reach the site whatever the PM2 or Node version.
// serveur.env (not tracked by git) wins; .env is only a fallback for older installs.
const fs = require("fs");
const path = require("path");
const dir = "/var/www/cercle";
const env = { NODE_ENV: "production" };
const file = ["serveur.env", ".env"].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
try {
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
} catch (e) {
  console.error("Fichier serveur.env introuvable dans " + dir);
}
module.exports = {
  apps: [{ name: "cercle", script: ".output/server/index.mjs", cwd: dir, env }],
};

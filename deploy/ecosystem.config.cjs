// Reads .env itself so the settings reach the site whatever the PM2 or Node version.
const fs = require("fs");
const path = require("path");
const dir = "/var/www/cercle";
const env = { NODE_ENV: "production" };
try {
  for (const line of fs.readFileSync(path.join(dir, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
} catch (e) {
  console.error("Fichier .env introuvable dans " + dir);
}
module.exports = {
  apps: [{ name: "cercle", script: ".output/server/index.mjs", cwd: dir, env }],
};

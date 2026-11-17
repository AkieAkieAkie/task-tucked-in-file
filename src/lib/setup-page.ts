// Dependency-free page listing missing server settings (no values are shown).
export function renderSetupPage(problems: string[]): string {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><title>Réglages du serveur incomplets</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{font:15px/1.6 system-ui,sans-serif;background:#111;color:#eee;display:grid;place-items:center;min-height:100vh;margin:0;padding:1.5rem}
.c{max-width:36rem}h1{font-size:1.25rem}li{margin:.4rem 0}code{background:#222;padding:.1rem .35rem;border-radius:4px}</style></head>
<body><div class="c"><h1>Réglages du serveur incomplets</h1><ul>${problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
<p>Corrige le fichier <code>.env</code> dans le dossier du site, puis lance <code>pm2 restart cercle --update-env</code>.</p></div></body></html>`;
}

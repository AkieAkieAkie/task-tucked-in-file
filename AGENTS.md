<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Site access and admin editing are gated by server-checked codes (SITE_PASSWORD, ADMIN_PASSWORD env) stored in an encrypted session cookie; codes never ship to the browser.
- Shared friend data uses a private database singleton with version-checked writes through cookie-gated server functions; direct browser table access is denied because shared codes do not establish account identities.
- Directory queries refresh on focus and every 15 seconds while visible; editing snapshots retain their original version to reject stale overwrites, and legacy device records import explicitly without replacing shared IDs.
- Server data access goes through src/lib/store.server.ts: self-hosted PostgreSQL when DATABASE_URL is set, Lovable Cloud otherwise; why: the app can be self-hosted on a VPS without the Cloud service key. Deploy files live in deploy/.
- src/server.ts checks required settings (src/lib/config-check.ts) before each request and pg errors are rethrown as French hints; why: self-hosted installs otherwise show a generic error page with no clue. deploy/ecosystem.config.cjs parses .env itself so settings load regardless of PM2/Node flags.
- src/start.ts must not register attachSupabaseAuth; why: the app has no Supabase accounts and the browser Supabase client throws on self-hosted builds without VITE_SUPABASE_* vars, breaking every page.
- Self-hosted settings live in an untracked serveur.env (read by deploy/ecosystem.config.cjs, .env only as fallback) and updates go through deploy/mettre-a-jour.sh; why: the tracked .env edited on the VPS made git pull refuse, so old code kept running.

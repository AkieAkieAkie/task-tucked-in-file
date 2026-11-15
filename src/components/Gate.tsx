import { useRouter, getRouteApi } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { lock, unlock } from "@/lib/gate.functions";

const root = getRouteApi("__root__");
export const useAccess = () => root.useLoaderData();

export function CodeForm({ level, onDone, title, kicker }: { level: "site" | "admin"; onDone?: () => void; title: string; kicker: string }) {
  const router = useRouter();
  const run = useServerFn(unlock);
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 text-center"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        const r = await run({ data: { level, code } });
        setBusy(false);
        if (r.ok) { await router.invalidate(); onDone?.(); } else { setErr(true); setCode(""); }
      }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{kicker}</p>
      <h1 className="font-display text-3xl">{title}</h1>
      <input autoFocus type="password" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }} placeholder="Code"
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-lg tracking-widest text-foreground outline-none focus:border-gold" />
      {err && <p className="text-sm font-bold text-rank-s">Code incorrect</p>}
      <button disabled={busy || !code} className="w-full rounded-lg bg-gold py-3 font-bold text-primary-foreground disabled:opacity-50">{busy ? "…" : "Valider"}</button>
      {onDone && <button type="button" onClick={onDone} className="text-sm text-muted-foreground">Annuler</button>}
    </form>
  );
}

export function AdminButton() {
  const { admin } = useAccess();
  const router = useRouter();
  const out = useServerFn(lock);
  const [open, setOpen] = useState(false);
  if (admin) return <button onClick={async () => { await out({ data: { level: "admin" } }); await router.invalidate(); }} className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-bold text-gold">Admin ✓ · Quitter</button>;
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-border px-4 py-3 text-sm font-bold hover:border-gold hover:text-gold">🔒 Accès admin</button>
      {open && <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"><CodeForm level="admin" kicker="Modification" title="Accès admin" onDone={() => setOpen(false)} /></div>}
    </>
  );
}

import { useRouter, getRouteApi } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { changeCode, lock, unlock } from "@/lib/gate.functions";

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
  if (admin) return (<>
    <CodesButton />
    <button onClick={async () => { await out({ data: { level: "admin" } }); await router.invalidate(); }} className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-bold text-gold">Admin ✓ · Quitter</button>
  </>);
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-border px-4 py-3 text-sm font-bold hover:border-gold hover:text-gold">🔒 Accès admin</button>
      {open && <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"><CodeForm level="admin" kicker="Modification" title="Accès admin" onDone={() => setOpen(false)} /></div>}
    </>
  );
}

function CodesButton() {
  const run = useServerFn(changeCode);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<"site" | "admin">("site");
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const f = "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-gold";
  const close = () => { setOpen(false); setCurrent(""); setNext(""); setConfirm(""); setMsg(null); };
  return (<>
    <button onClick={() => setOpen(true)} className="rounded-lg border border-border px-4 py-3 text-sm font-bold hover:border-gold hover:text-gold">🔑 Codes</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" onClick={close}>
      <form onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-8 animate-in fade-in zoom-in-95" onSubmit={async (e) => {
        e.preventDefault();
        if (next !== confirm) return setMsg({ ok: false, text: "Les deux nouveaux codes ne correspondent pas." });
        setBusy(true); const r = await run({ data: { level, current, next } }); setBusy(false);
        setMsg(r.ok ? { ok: true, text: "Code modifié." } : { ok: false, text: r.error });
        if (r.ok) { setCurrent(""); setNext(""); setConfirm(""); }
      }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Sécurité</p>
        <h2 className="font-display text-2xl">Changer un code</h2>
        <select className={f} value={level} onChange={(e) => setLevel(e.target.value as "site" | "admin")}><option value="site">Code d'accès au site</option><option value="admin">Code admin</option></select>
        <input type="password" className={f} placeholder="Code admin actuel" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <input type="password" className={f} placeholder="Nouveau code" value={next} onChange={(e) => setNext(e.target.value)} />
        <input type="password" className={f} placeholder="Confirmer le nouveau code" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {msg && <p className={`text-sm font-bold ${msg.ok ? "text-rank-m" : "text-rank-s"}`}>{msg.text}</p>}
        <button disabled={busy || !current || !next} className="w-full rounded-lg bg-gold py-3 font-bold text-primary-foreground disabled:opacity-50">{busy ? "…" : "Enregistrer"}</button>
        <button type="button" onClick={close} className="w-full text-sm text-muted-foreground">Fermer</button>
      </form>
    </div>}
  </>);
}

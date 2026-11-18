import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createBackup, getBackup, listBackups } from "@/lib/friends.functions";
import type { Friend } from "@/lib/friends";

type Meta = Awaited<ReturnType<typeof listBackups>>[number];
const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export function BackupPanel({ onClose, restore }: { onClose: () => void; restore: (friends: Friend[]) => Promise<boolean> }) {
  const [items, setItems] = useState<Meta[] | null>(null);
  const [err, setErr] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ meta: Meta; friends: Friend[] } | null>(null);
  const load = () => listBackups().then(setItems).catch(() => setErr("Impossible de charger les sauvegardes."));
  useEffect(() => { load(); }, []);

  const manual = async () => {
    setBusy(true);
    try { await createBackup({ data: { label: label.trim() || "Sauvegarde manuelle" } }); setLabel(""); await load(); } catch { setErr("Sauvegarde manuelle impossible, réessaie."); }
    setBusy(false);
  };
  const open = async (meta: Meta) => {
    setBusy(true);
    try { const b = await getBackup({ data: { id: meta.id } }); setPreview({ meta, friends: b.friends as Friend[] }); } catch { setErr("Lecture impossible."); }
    setBusy(false);
  };
  const download = (p: { meta: Meta; friends: Friend[] }) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ friends: p.friends }, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `cercle-v${p.meta.version}-${p.meta.created_at.slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  const doRestore = async (p: { meta: Meta; friends: Friend[] }) => {
    if (!confirm(`Restaurer la version ${p.meta.version} du ${when(p.meta.created_at)} (${p.friends.length} fiches) ? L'état actuel sera gardé dans l'historique.`)) return;
    setBusy(true);
    if (await restore(p.friends)) { setPreview(null); await load(); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gold/30 bg-card animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-6">
          <button onClick={onClose} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-lg border border-border">✕</button>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Administration</p>
          <h2 className="mt-1 text-3xl font-bold">{preview ? `Version ${preview.meta.version}` : "Sauvegardes"}</h2>
          {err && <p className="mt-2 text-sm text-rank-s">{err}</p>}
        </div>
        {preview ? (
          <div className="flex min-h-0 flex-col border-t border-border">
            <div className="flex flex-wrap gap-2 p-4">
              <Button variant="outline" onClick={() => setPreview(null)}>← Retour</Button>
              <Button variant="outline" onClick={() => download(preview)}>⇩ Télécharger</Button>
              <Button disabled={busy} onClick={() => doRestore(preview)} className="bg-gold font-bold text-primary-foreground">Restaurer cette version</Button>
            </div>
            <p className="px-4 text-sm text-muted-foreground">{when(preview.meta.created_at)} · {preview.friends.length} fiches</p>
            <ul className="space-y-2 overflow-y-auto p-4">
              {preview.friends.map((f) => <li key={f.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background/40 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-md border font-display text-sm">{f.rank}</span>
                <span className="min-w-0"><span className="block truncate font-bold">{f.name || "—"}</span><span className="block truncate text-xs text-muted-foreground">{f.group || "—"} · {f.role || "—"}</span></span>
                <span className={`text-xs font-bold ${f.blacklisted ? "text-rank-s" : "text-rank-m"}`}>{f.blacklisted ? "Blacklisté" : "OK"}</span>
              </li>)}
            </ul>
          </div>
        ) : (
          <div className="flex min-h-0 flex-col border-t border-border">
            <div className="flex flex-wrap gap-2 p-4">
              <input className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" placeholder="Nom de la sauvegarde (optionnel)" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} />
              <Button disabled={busy} onClick={manual} className="bg-gold font-bold text-primary-foreground">+ Sauvegarde manuelle</Button>
            </div>
            <ul className="space-y-2 overflow-y-auto p-4 pt-0">
              {items === null && <li className="text-sm text-muted-foreground">Chargement…</li>}
              {items?.length === 0 && <li className="text-sm text-muted-foreground">Aucune sauvegarde pour l'instant. Une version est gardée automatiquement à chaque modification.</li>}
              {items?.map((m) => <li key={m.id}><button disabled={busy} onClick={() => open(m)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-left hover:border-gold">
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${m.kind === "manual" ? "border-gold/50 text-gold" : "border-border text-muted-foreground"}`}>{m.kind === "manual" ? "Manuelle" : "Auto"}</span>
                <span className="min-w-0"><span className="block truncate font-bold">{m.label || `Version ${m.version}`}</span><span className="block text-xs text-muted-foreground">{when(m.created_at)} · v{m.version} · {m.count} fiches</span></span>
                <span className="text-muted-foreground">→</span>
              </button></li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

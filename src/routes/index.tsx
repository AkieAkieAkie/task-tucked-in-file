import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AdminButton, useAccess } from "@/components/Gate";
import { Button } from "@/components/ui/button";
import { WARN, nextBirthday, daysLeft, fmt, isActive, RANKS, blankFriend, useFriends, type Rank } from "@/lib/friends";
import { friendSchema } from "@/lib/friend-schema";
import { BackupPanel } from "@/components/BackupPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cercle privé — Mes amis" },
      { name: "description", content: "Les fiches de mes amis, classées E · M · A · T · F · S." },
      { property: "og:title", content: "Équipe — Le classement de mes amis" },
      { property: "og:description", content: "Les fiches de mes amis, classées E · M · A · T · F · S." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Equipe,
});

const field = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold";
const lbl = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

function Equipe() {
  const { list, save, saving, localCount, importLocal } = useFriends();
  const { admin } = useAccess();
  const nav = useNavigate();
  const [q, setQ] = useState(""); const [g, setG] = useState(""); const [r, setR] = useState(""); const [st, setSt] = useState("");
  const groups = useMemo(() => [...new Set(list.map((f) => f.group || "Non renseigné"))], [list]);
  const shown = list.filter((f) => {
    const t = `${f.name} ${f.ig} ${f.phone} ${f.role}`.toLowerCase();
    return t.includes(q.toLowerCase()) && (!g || (f.group || "Non renseigné") === g) && (!r || f.rank === r) && (!st || (st === "bl") === f.blacklisted);
  });
  const [showW, setShowW] = useState(false);
  const [showB, setShowB] = useState(false);
  const active = list.flatMap((f) => f.warnings.filter(isActive).map((w) => ({ f, w }))).sort((a, b) => a.w.until!.localeCompare(b.w.until!));
  const bdays = list.map((f) => ({ f, b: nextBirthday(f.birthday) })).filter((x): x is { f: typeof x.f; b: NonNullable<typeof x.b> } => !!x.b && x.b.days <= 30).sort((a, b) => a.b.days - b.b.days);
  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ friends: list }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `cercle-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  const importAll = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = friendSchema.array().parse(JSON.parse(await file.text()).friends);
      if (confirm(`Remplacer les ${list.length} fiches actuelles par les ${parsed.length} fiches du fichier ?`)) await save(parsed);
    } catch { alert("Fichier de sauvegarde invalide."); }
  };
  const add = async () => { const f = blankFriend(); if (await save([f, ...list])) await nav({ to: "/fiche/$id", params: { id: f.id }, search: { edit: true } }); };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:px-6 sm:py-20">
        <div>
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold"><span className="h-2 w-2 rounded-full bg-rank-m" />Archives publiques validées</p>
          <h1 className="font-display text-5xl sm:text-6xl leading-[0.95] md:text-8xl">Cercle<br /><span className="text-gold">privé.</span></h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-display text-5xl text-gold">{list.length}</div>
          <div className="font-bold">fiches publiques</div>
          <div className="mt-3 text-sm text-muted-foreground">Classifications E · M · A · T · F · S</div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Annuaire</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-4xl font-bold">Les fiches</h2><p className="mt-1 text-muted-foreground">{shown.length} résultats</p></div>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto"><button onClick={() => setShowW(true)} className="flex items-center gap-2 rounded-lg border border-rank-s/40 bg-rank-s/10 px-4 py-3 text-sm font-bold">Avertissements actifs <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rank-s px-1.5 text-xs text-foreground">{active.length}</span></button><AdminButton />{admin && <Button disabled={saving} onClick={add} className="h-auto rounded-lg bg-gold px-5 py-3 font-bold text-primary-foreground">{saving ? "Enregistrement…" : "+ Ajouter un ami"}</Button>}</div>
          </div>

          {admin && <div className="mt-5 flex flex-wrap gap-2 text-sm"><Button variant="outline" onClick={() => setShowB(true)}>🕘 Historique des sauvegardes</Button><Button variant="outline" onClick={exportAll}>⇩ Sauvegarder toutes les fiches</Button><label className="inline-flex cursor-pointer items-center rounded-md border border-input px-4 py-2 font-medium hover:border-gold">⇧ Restaurer une sauvegarde<input type="file" accept="application/json" className="hidden" onChange={(e) => importAll(e.target.files?.[0])} /></label></div>}
          {admin && localCount > 0 && <div className="mt-5 flex flex-wrap items-center gap-3 border-l-2 border-gold pl-4"><p className="text-sm text-muted-foreground">{localCount} fiche(s) conservée(s) sur cet appareil.</p><Button variant="outline" disabled={saving} onClick={importLocal}>Importer les fiches de cet appareil</Button></div>}

          {bdays.length > 0 && <div className="mt-6 rounded-xl border border-gold/40 bg-gold/5 p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">🎂 Anniversaires à venir</p>
            <div className="mt-3 flex flex-wrap gap-2">{bdays.map(({ f, b }) => (
              <Link key={f.id} to="/fiche/$id" params={{ id: f.id }} search={{ edit: false }} className={`rounded-full border px-3 py-1.5 text-sm font-bold transition hover:border-gold ${b.days === 0 ? "border-gold bg-gold text-primary-foreground" : "border-border bg-background/40"}`}>
                {f.name} · {b.days === 0 ? "aujourd'hui !" : b.days === 1 ? "demain" : `dans ${b.days} j`}{b.age > 0 && b.age < 150 ? ` · ${b.age} ans` : ""}
              </Link>))}</div>
          </div>}

          <div className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div><label className={lbl}>Rechercher une fiche</label><input className={field} placeholder="Nom, Instagram, numéro ou rank" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div><label className={lbl}>De où</label><select className={field} value={g} onChange={(e) => setG(e.target.value)}><option value="">Tous les lieux</option>{groups.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className={lbl}>Classification</label><select className={field} value={r} onChange={(e) => setR(e.target.value)}><option value="">Toutes les classifications</option>{(Object.keys(RANKS) as Rank[]).map((k) => <option key={k} value={k}>{k} — {RANKS[k].label}</option>)}</select></div>
            <div><label className={lbl}>État de la fiche</label><select className={field} value={st} onChange={(e) => setSt(e.target.value)}><option value="">Tous les statuts</option><option value="ok">Non blacklisté</option><option value="bl">Blacklisté</option></select></div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((f, i) => { const R = RANKS[f.rank]; return (
              <Link key={f.id} to="/fiche/$id" params={{ id: f.id }} search={{ edit: false }} style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-lg animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 transition sm:p-6 hover:-translate-y-1 hover:border-gold/50">
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${R.grad} to-transparent`} />
                <span className={`pointer-events-none absolute -right-2 top-10 select-none font-display text-9xl leading-none opacity-[0.06] ${R.text}`}>{f.rank}</span>
                <div className="relative flex flex-wrap items-center gap-2">
                  <span className="max-w-[45%] truncate rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase text-gold">{f.group || "—"}</span>
                  <span className={`grid h-7 w-7 place-items-center rounded-md border font-display text-sm ${R.text} ${R.soft}`}>{f.rank}</span>
                  <span className={`text-xs font-bold ${R.text}`}>{R.label}</span>
                  <span className="ml-auto grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground group-hover:text-gold">↗</span>
                </div>
                <div className="relative mt-6 flex items-center gap-4">
                  {f.avatar ? <img src={f.avatar} alt={f.name} className="h-16 w-16 rounded-2xl object-cover shadow-lg" /> : <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold to-rank-f font-display text-2xl text-primary-foreground shadow-lg">{f.name[0]?.toUpperCase()}</div>}
                  <div className="min-w-0"><h3 className="break-words text-xl font-bold">{f.name}</h3><p className="truncate text-sm text-muted-foreground">{f.role || "—"}</p></div>
                </div>
                <dl className="relative mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-border bg-background/40 p-4 text-sm">
                  {([["Instagram", f.ig ? `@${f.ig.replace(/^@/, "")}` : "", ""], ["Numéro", f.phone, ""], ["Statut", f.blacklisted ? "Blacklisté" : "Non blacklisté", f.blacklisted ? "text-rank-s" : "text-rank-m"], ["Avertissements", `${f.warnings.filter(isActive).length} actif${f.warnings.filter(isActive).length > 1 ? "s" : ""}`, f.warnings.some((w) => isActive(w) && w.kind !== "oral") ? "text-rank-s" : f.warnings.some(isActive) ? "text-oral" : ""]] as const).map(([k, v, c]) => (
                    <div key={k} className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k}</dt><dd className={`mt-1 truncate font-bold ${c}`}>{v || "—"}</dd></div>
                  ))}
                </dl>
                <div className="relative mt-5 flex items-center justify-between text-sm font-bold"><span>Consulter la fiche</span><span className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-primary-foreground">→</span></div>
              </Link>); })}
          </div>
        </div>
      </section>

      {showB && <BackupPanel onClose={() => setShowB(false)} restore={(f) => save(f)} />}
      {showW && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setShowW(false)}>
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-rank-s/30 bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gradient-to-br from-rank-s/15 to-transparent p-7">
              <button onClick={() => setShowW(false)} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-lg border border-border">✕</button>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-rank-s">Cercle actuellement actif</p>
              <h2 className="mt-1 text-3xl font-bold">Avertissements actifs</h2>
            </div>
            <div className="flex flex-wrap gap-2 border-y border-border px-7 py-4 text-xs font-bold">
              <span className="rounded-full border border-border px-3 py-1.5">{active.length} avertissements</span>
              <span className="rounded-full border border-border px-3 py-1.5">{new Set(active.map((a) => a.f.id)).size} amis concernés</span>
            </div>
            <div className="space-y-3 overflow-y-auto p-7">
              {!active.length && <p className="text-center text-muted-foreground">Aucun avertissement actif.</p>}
              {active.map(({ f, w }) => { const W = WARN[w.kind ?? "ecrit"]; const d = daysLeft(w); return (
                <Link key={w.id} to="/fiche/$id" params={{ id: f.id }} search={{ edit: false }} className={`grid gap-4 rounded-xl border border-l-4 border-border ${W.bar} bg-background/40 p-4 sm:grid-cols-[1fr_1.5fr_auto]`}>
                  <div className="flex items-center gap-3">
                    {f.avatar ? <img src={f.avatar} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold to-rank-f font-display text-primary-foreground">{f.name[0]?.toUpperCase()}</div>}
                    <div><div className="font-bold">{f.name}</div><div className="text-xs text-muted-foreground">{f.role || "—"}</div></div>
                  </div>
                  <div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${W.soft} ${W.text}`}>{W.label}</span>
                    <div className="mt-2 text-sm font-medium">{w.title || "—"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Attribué{w.by ? ` par ${w.by}` : ""} le {fmt(w.date)}</div>
                  </div>
                  <div className="text-right"><div className="text-sm font-bold">Jusqu'au {fmt(w.until!)}</div><div className="text-xs text-muted-foreground">{d === 0 ? "Dernier jour" : `${d} jour${d > 1 ? "s" : ""} restant${d > 1 ? "s" : ""}`}</div></div>
                </Link>); })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { RANKS, fileToDataUrl, fmt, uid, useFriends, type Friend, type Item, type Rank } from "@/lib/friends";

export const Route = createFileRoute("/fiche/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ edit: s["edit"] === true || s["edit"] === "true" }),
  head: () => ({
    meta: [
      { title: "Fiche d'ami — Le classement de mes amis" },
      { name: "description", content: "Profil, évaluation, parcours, badges et avertissements d'un ami." },
      { property: "og:title", content: "Fiche d'ami" },
      { property: "og:description", content: "Profil, évaluation, parcours, badges et avertissements d'un ami." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Fiche,
});

const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold";
const lbl = "mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground";
const btn = "rounded-lg border border-border px-4 py-2 text-sm font-bold transition hover:border-gold hover:text-gold";

function Section({ kicker, title, children, watermark }: { kicker: string; title: string; children: ReactNode; watermark?: string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
      {watermark && <span className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-9xl text-foreground/5">{watermark}</span>}
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{kicker}</p>
      <h2 className="mb-6 mt-1 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ItemList({ items, edit, onChange, kind }: { items: Item[]; edit: boolean; onChange: (i: Item[]) => void; kind: "history" | "badge" | "warning" }) {
  const upd = (id: string, p: Partial<Item>) => onChange(items.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const sorted = edit ? items : [...items].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      {!sorted.length && !edit && <p className="text-muted-foreground">Rien pour le moment.</p>}
      <ol className={kind === "history" ? "relative space-y-5 border-l border-border pl-6" : "grid gap-3 sm:grid-cols-2"}>
        {sorted.map((it) => (
          <li key={it.id} className={kind === "history" ? "relative" : `flex items-start gap-3 rounded-xl border p-4 ${kind === "warning" ? "border-rank-s/40 bg-rank-s/10" : "border-gold/30 bg-gold/5"}`}>
            {kind === "history" && <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-gold ring-4 ring-card" />}
            {kind !== "history" && <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display ${kind === "warning" ? "bg-rank-s text-foreground" : "bg-gold text-primary-foreground"}`}>{kind === "warning" ? "!" : "★"}</span>}
            {edit ? (
              <div className="grid flex-1 gap-2">
                <div className="flex gap-2"><input type="date" className={field} value={it.date} onChange={(e) => upd(it.id, { date: e.target.value })} /><button onClick={() => onChange(items.filter((x) => x.id !== it.id))} className="px-2 text-rank-s">✕</button></div>
                <input className={field} placeholder="Titre" value={it.title} onChange={(e) => upd(it.id, { title: e.target.value })} />
                <input className={field} placeholder="Détail (optionnel)" value={it.note} onChange={(e) => upd(it.id, { note: e.target.value })} />
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-muted-foreground">{fmt(it.date)}</div>
                <div className="font-bold">{it.title}</div>
                {it.note && <div className="text-sm text-muted-foreground">{it.note}</div>}
              </div>
            )}
          </li>
        ))}
      </ol>
      {edit && <button className={`${btn} mt-4`} onClick={() => onChange([...items, { id: uid(), date: new Date().toISOString().slice(0, 10), title: "", note: "" }])}>+ Ajouter</button>}
    </div>
  );
}

function Fiche() {
  const { id } = Route.useParams();
  const { edit } = Route.useSearch();
  const nav = useNavigate();
  const { list, ready, save } = useFriends();
  const saved = list.find((f) => f.id === id);
  const [draft, setDraft] = useState<Friend | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  if (!ready) return <main className="min-h-screen bg-background" />;
  if (!saved) return (
    <main className="grid min-h-screen place-items-center bg-background text-center">
      <div><h1 className="text-3xl font-bold">Fiche introuvable</h1><Link to="/" className="mt-4 inline-block font-bold text-gold">← Retour à l'annuaire</Link></div>
    </main>
  );

  const f = edit ? (draft?.id === id ? draft : saved) : saved;
  const set = (p: Partial<Friend>) => setDraft({ ...f, ...p } as Friend);
  const setEdit = (v: boolean) => nav({ to: "/fiche/$id", params: { id }, search: { edit: v }, replace: true });
  const R = RANKS[f.rank];
  const commit = () => { save(list.map((x) => (x.id === id ? f : x))); setDraft(null); setEdit(false); };
  const cancel = () => { setDraft(null); setEdit(false); };
  const remove = () => { if (confirm(`Supprimer la fiche de ${f.name} ?`)) { save(list.filter((x) => x.id !== id)); nav({ to: "/" }); } };

  const info: [string, keyof Friend, string?][] = [["De où", "group"], ["Instagram", "ig"], ["Numéro", "phone", "tel"], ["Ami depuis", "since", "date"]];

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-sm font-bold text-gold">← Retour à l'annuaire</Link>
          <div className="flex gap-2">
            {edit ? (<>
              <button className={btn} onClick={cancel}>Annuler</button>
              <button className="rounded-lg bg-gold px-5 py-2 text-sm font-bold text-primary-foreground" onClick={commit}>Enregistrer</button>
            </>) : (<>
              <button className={btn} onClick={() => setEdit(true)}>✎ Modifier</button>
              <button className={`${btn} hover:border-rank-s hover:text-rank-s`} onClick={remove}>Supprimer</button>
            </>)}
          </div>
        </div>

        <header className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-card to-transparent p-8 ${R.soft}`}>
          <div className={`absolute inset-x-0 bottom-0 h-0.5 ${R.bg}`} />
          <span className={`pointer-events-none absolute right-48 top-0 select-none font-display text-[10rem] leading-none opacity-10 ${R.text}`}>{f.rank}</span>
          <div className="relative flex flex-wrap items-center gap-6">
            <label className={`relative ${edit ? "cursor-pointer" : ""}`}>
              {f.avatar ? <img src={f.avatar} alt={f.name} className="h-24 w-24 rounded-2xl object-cover" /> : <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-gold to-rank-f font-display text-4xl text-primary-foreground">{f.name[0]?.toUpperCase()}</div>}
              {edit && <><span className="absolute inset-0 grid place-items-center rounded-2xl bg-background/70 text-xs font-bold">Changer</span>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) set({ avatar: await fileToDataUrl(file, 300) }); }} /></>}
            </label>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Fiche validée · {f.group || "Cercle privé"}</p>
              {edit ? (<div className="mt-2 grid max-w-md gap-2"><input className={`${field} text-2xl font-bold`} value={f.name} onChange={(e) => set({ name: e.target.value })} /><input className={field} placeholder="Rank (ex : Meilleur pote)" value={f.role} onChange={(e) => set({ role: e.target.value })} />
                {f.avatar && <button className="w-fit text-xs text-muted-foreground" onClick={() => set({ avatar: "" })}>Retirer la photo</button>}</div>)
                : (<><h1 className="text-5xl font-bold">{f.name}</h1><p className="mt-1 text-muted-foreground">{f.role || "—"}</p></>)}
            </div>
            <div className={`rounded-2xl border px-8 py-4 text-center ${R.soft}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${R.text}`}>◆ {R.tier}</p>
              {edit ? <select className={`${field} mt-2`} value={f.rank} onChange={(e) => set({ rank: e.target.value as Rank })}>{(Object.keys(RANKS) as Rank[]).map((k) => <option key={k} value={k}>{k} — {RANKS[k].label}</option>)}</select>
                : <><div className={`font-display text-5xl ${R.text}`}>{f.rank}</div><div className="text-muted-foreground">{R.label}</div></>}
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-y-6 border-b border-border pb-8 sm:grid-cols-3 lg:grid-cols-5">
          {info.map(([l, k, t]) => (
            <div key={k} className="border-l border-border px-6">
              <div className="text-xs text-muted-foreground">{l}</div>
              {edit ? <input type={t ?? "text"} className={`${field} mt-1`} value={String(f[k])} onChange={(e) => set({ [k]: e.target.value })} />
                : <div className="mt-1 font-bold">{t === "date" ? fmt(String(f[k])) : String(f[k]) || "—"}</div>}
            </div>
          ))}
          <div className="border-l border-border px-6">
            <div className="text-xs text-muted-foreground">Statut</div>
            {edit ? <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.blacklisted} onChange={(e) => set({ blacklisted: e.target.checked })} />Blacklisté</label>
              : <div className={`mt-1 font-bold ${f.blacklisted ? "text-rank-s" : "text-rank-m"}`}>{f.blacklisted ? "Blacklisté" : "Fiche validée"}</div>}
          </div>
        </div>

        <div className="mt-10 grid gap-6">
          <Section kicker="Avis final" title="Évaluation du parcours" watermark="AVIS">
            {edit ? (<div className="grid gap-3"><textarea rows={5} className={field} placeholder="Ce que tu penses de cet ami…" value={f.review} onChange={(e) => set({ review: e.target.value })} />
              <div><label className={lbl}>Remarque</label><input className={field} value={f.remark} onChange={(e) => set({ remark: e.target.value })} /></div></div>)
              : (<div className="mx-auto max-w-3xl text-center">
                <div className="text-left font-display text-5xl text-gold">“</div>
                <p className="text-xl font-bold leading-relaxed">{f.review || "Pas encore d'avis."}</p>
                {f.remark && <div className="mt-8 rounded-lg border-l-4 border-gold bg-background/50 px-5 py-3 text-left"><div className="text-[11px] font-bold uppercase tracking-widest text-gold">Remarque</div><div className="font-bold">{f.remark}</div></div>}
              </div>)}
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section kicker="Progression" title="Historique de notre parcours"><ItemList kind="history" edit={edit} items={f.history} onChange={(history) => set({ history })} /></Section>
            <div className="grid gap-6">
              <Section kicker="Récompenses" title="Badges obtenus"><ItemList kind="badge" edit={edit} items={f.badges} onChange={(badges) => set({ badges })} /></Section>
              <Section kicker="Discipline" title={`Avertissements · ${f.warnings.length}`}><ItemList kind="warning" edit={edit} items={f.warnings} onChange={(warnings) => set({ warnings })} /></Section>
            </div>
          </div>

          <Section kicker="Souvenirs" title="Photos">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {f.photos.map((p, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={p} alt="" className="h-full w-full cursor-zoom-in object-cover transition group-hover:scale-105" onClick={() => !edit && setZoom(p)} />
                  {edit && <button className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/80 text-rank-s" onClick={() => set({ photos: f.photos.filter((_, j) => j !== i) })}>✕</button>}
                </div>
              ))}
              {edit && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-sm font-bold text-muted-foreground hover:border-gold hover:text-gold">
                  + Ajouter des photos
                  <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const files = Array.from(e.target.files ?? []); const urls = await Promise.all(files.map((x) => fileToDataUrl(x))); set({ photos: [...f.photos, ...urls] }); }} />
                </label>
              )}
              {!edit && !f.photos.length && <p className="text-muted-foreground">Aucune photo. Clique sur « Modifier » pour en ajouter.</p>}
            </div>
          </Section>
        </div>
      </div>
      {zoom && <div className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-background/90 p-6" onClick={() => setZoom(null)}><img src={zoom} alt="" className="max-h-full max-w-full rounded-xl" /></div>}
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Équipe — Le classement de mes amis" },
      { name: "description", content: "Les fiches de mes amis, classées E · M · A · T · F · S." },
      { property: "og:title", content: "Équipe — Le classement de mes amis" },
      { property: "og:description", content: "Les fiches de mes amis, classées E · M · A · T · F · S." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Equipe,
});

const RANKS = {
  E: { label: "Exceptionnel", cls: "text-rank-e border-rank-e/50 bg-rank-e/10", bar: "bg-rank-e" },
  M: { label: "Très bien", cls: "text-rank-m border-rank-m/50 bg-rank-m/10", bar: "bg-rank-m" },
  A: { label: "Bien", cls: "text-rank-a border-rank-a/50 bg-rank-a/10", bar: "bg-rank-a" },
  T: { label: "Neutre", cls: "text-rank-t border-rank-t/50 bg-rank-t/10", bar: "bg-rank-t" },
  F: { label: "Médiocre", cls: "text-rank-f border-rank-f/50 bg-rank-f/10", bar: "bg-rank-f" },
  S: { label: "Danger / blacklist", cls: "text-rank-s border-rank-s/50 bg-rank-s/10", bar: "bg-rank-s" },
} as const;
type Rank = keyof typeof RANKS;
type Friend = { id: string; name: string; role: string; group: string; steam: string; discord: string; rank: Rank; blacklisted: boolean; badges: number };

const SAMPLE: Friend[] = [
  { id: "1", name: "Mike Avilso", role: "Helpeur · Ancien staff", group: "DarkRP", steam: "STEAM_0:0:566289586", discord: "719618970411597836", rank: "F", blacklisted: false, badges: 0 },
  { id: "2", name: "Aziz Nashia", role: "Modérateur · Ancien staff", group: "DarkRP", steam: "STEAM_0:0:833521060", discord: "1292595431410241689", rank: "A", blacklisted: false, badges: 2 },
  { id: "3", name: "Timothé Lacombe", role: "Administrateur-Sénior", group: "MilitaryRP", steam: "STEAM_0:1:637123030", discord: "1390397826806186176", rank: "E", blacklisted: false, badges: 5 },
];
const KEY = "mes-amis-fiches";
const field = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold";
const lbl = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground";
const empty: Omit<Friend, "id"> = { name: "", role: "", group: "", steam: "", discord: "", rank: "T", blacklisted: false, badges: 0 };

function Equipe() {
  const [list, setList] = useState<Friend[]>(SAMPLE);
  const [q, setQ] = useState(""); const [g, setG] = useState(""); const [r, setR] = useState(""); const [st, setSt] = useState("");
  const [form, setForm] = useState<(Omit<Friend, "id"> & { id?: string }) | null>(null);
  useEffect(() => { const s = localStorage.getItem(KEY); if (s) setList(JSON.parse(s)); }, []);
  const save = (l: Friend[]) => { setList(l); localStorage.setItem(KEY, JSON.stringify(l)); };
  const groups = useMemo(() => [...new Set(list.map((f) => f.group || "Non renseigné"))], [list]);
  const shown = list.filter((f) => {
    const t = `${f.name} ${f.steam} ${f.discord} ${f.role}`.toLowerCase();
    return t.includes(q.toLowerCase()) && (!g || (f.group || "Non renseigné") === g) && (!r || f.rank === r) && (!st || (st === "bl") === f.blacklisted);
  });
  const submit = () => {
    if (!form?.name.trim()) return;
    const f = { ...form, id: form.id ?? crypto.randomUUID() } as Friend;
    save(form.id ? list.map((x) => (x.id === f.id ? f : x)) : [f, ...list]); setForm(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-6 py-20">
        <div>
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold"><span className="h-2 w-2 rounded-full bg-rank-m" />Archives publiques validées</p>
          <h1 className="font-display text-6xl leading-[0.95] md:text-8xl">Chaque<br />parcours<br /><span className="text-gold">laisse une<br />trace.</span></h1>
          <p className="mt-6 max-w-xl text-muted-foreground">Retrouve l’évolution, les récompenses et l’évaluation finale de mes amis.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-display text-5xl text-gold">{list.length}</div>
          <div className="font-bold">fiches publiques</div>
          <div className="mt-3 text-sm text-muted-foreground">Classifications E · M · A · T · F · S</div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Annuaire</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-4xl font-bold">Les fiches</h2><p className="mt-1 text-muted-foreground">{shown.length} résultats</p></div>
            <button onClick={() => setForm({ ...empty })} className="rounded-lg bg-gold px-5 py-3 font-bold text-primary-foreground">+ Ajouter un ami</button>
          </div>

          <div className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div><label className={lbl}>Rechercher une fiche</label><input className={field} placeholder="Nom, SteamID, Discord ou grade" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div><label className={lbl}>Serveur / service</label><select className={field} value={g} onChange={(e) => setG(e.target.value)}><option value="">Tous les services</option>{groups.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className={lbl}>Classification</label><select className={field} value={r} onChange={(e) => setR(e.target.value)}><option value="">Toutes les classifications</option>{(Object.keys(RANKS) as Rank[]).map((k) => <option key={k} value={k}>{k} — {RANKS[k].label}</option>)}</select></div>
            <div><label className={lbl}>État de la fiche</label><select className={field} value={st} onChange={(e) => setSt(e.target.value)}><option value="">Tous les statuts</option><option value="ok">Non blacklisté</option><option value="bl">Blacklisté</option></select></div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((f) => { const R = RANKS[f.rank]; return (
              <article key={f.id} className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
                <div className={`absolute inset-x-0 top-0 h-0.5 ${R.bar}`} />
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase text-gold">{f.group || "—"}</span>
                  <span className={`rounded-md border px-2 py-0.5 font-display ${R.cls}`}>{f.rank}</span>
                  <span className={`text-xs font-bold ${R.cls.split(" ")[0]}`}>{R.label}</span>
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-secondary font-display text-2xl text-gold">{f.name[0]?.toUpperCase()}</div>
                  <div><h3 className="text-xl font-bold">{f.name}</h3><p className="text-sm text-muted-foreground">{f.role}</p></div>
                </div>
                <dl className="mt-5 space-y-2 text-sm">
                  {[["SteamID", f.steam], ["Discord ID", f.discord], ["Statut", f.blacklisted ? "Blacklisté" : "Non blacklisté"], ["Badges", String(f.badges)]].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border pb-2"><dt className="text-muted-foreground">{k}</dt><dd className={k === "Statut" && f.blacklisted ? "text-rank-s font-bold" : "font-medium"}>{v || "—"}</dd></div>
                  ))}
                </dl>
                <div className="mt-4 flex gap-4 text-sm font-bold">
                  <button onClick={() => setForm(f)} className="text-gold">Modifier →</button>
                  <button onClick={() => confirm("Supprimer ?") && save(list.filter((x) => x.id !== f.id))} className="text-muted-foreground">Supprimer</button>
                </div>
              </article>); })}
          </div>
        </div>
      </section>

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-lg space-y-3 rounded-xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold">{form.id ? "Modifier la fiche" : "Nouvelle fiche"}</h3>
            {([["name", "Nom"], ["role", "Grade / rôle"], ["group", "Serveur / service"], ["steam", "SteamID"], ["discord", "Discord ID"]] as const).map(([k, l]) => (
              <div key={k}><label className={lbl}>{l}</label><input className={field} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Classification</label><select className={field} value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value as Rank })}>{(Object.keys(RANKS) as Rank[]).map((k) => <option key={k} value={k}>{k} — {RANKS[k].label}</option>)}</select></div>
              <div><label className={lbl}>Badges</label><input type="number" min={0} className={field} value={form.badges} onChange={(e) => setForm({ ...form, badges: Number(e.target.value) })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.blacklisted} onChange={(e) => setForm({ ...form, blacklisted: e.target.checked })} />Blacklisté</label>
            <div className="flex justify-end gap-3 pt-2"><button onClick={() => setForm(null)} className="px-4 py-2 text-muted-foreground">Annuler</button><button onClick={submit} className="rounded-lg bg-gold px-5 py-2 font-bold text-primary-foreground">Enregistrer</button></div>
          </div>
        </div>
      )}
    </main>
  );
}

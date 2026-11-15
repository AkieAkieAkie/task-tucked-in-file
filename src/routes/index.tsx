import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { RANKS, blankFriend, useFriends, type Rank } from "@/lib/friends";

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

const field = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold";
const lbl = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

function Equipe() {
  const { list, save } = useFriends();
  const nav = useNavigate();
  const [q, setQ] = useState(""); const [g, setG] = useState(""); const [r, setR] = useState(""); const [st, setSt] = useState("");
  const groups = useMemo(() => [...new Set(list.map((f) => f.group || "Non renseigné"))], [list]);
  const shown = list.filter((f) => {
    const t = `${f.name} ${f.steam} ${f.discord} ${f.role}`.toLowerCase();
    return t.includes(q.toLowerCase()) && (!g || (f.group || "Non renseigné") === g) && (!r || f.rank === r) && (!st || (st === "bl") === f.blacklisted);
  });
  const add = () => { const f = blankFriend(); save([f, ...list]); nav({ to: "/fiche/$id", params: { id: f.id }, search: { edit: true } }); };

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
            <button onClick={add} className="rounded-lg bg-gold px-5 py-3 font-bold text-primary-foreground">+ Ajouter un ami</button>
          </div>

          <div className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div><label className={lbl}>Rechercher une fiche</label><input className={field} placeholder="Nom, SteamID, Discord ou grade" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div><label className={lbl}>Serveur / service</label><select className={field} value={g} onChange={(e) => setG(e.target.value)}><option value="">Tous les services</option>{groups.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className={lbl}>Classification</label><select className={field} value={r} onChange={(e) => setR(e.target.value)}><option value="">Toutes les classifications</option>{(Object.keys(RANKS) as Rank[]).map((k) => <option key={k} value={k}>{k} — {RANKS[k].label}</option>)}</select></div>
            <div><label className={lbl}>État de la fiche</label><select className={field} value={st} onChange={(e) => setSt(e.target.value)}><option value="">Tous les statuts</option><option value="ok">Non blacklisté</option><option value="bl">Blacklisté</option></select></div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((f) => { const R = RANKS[f.rank]; return (
              <Link key={f.id} to="/fiche/$id" params={{ id: f.id }} search={{ edit: false }} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-gold/60">
                <div className={`absolute inset-x-0 top-0 h-0.5 ${R.bg}`} />
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase text-gold">{f.group || "—"}</span>
                  <span className={`rounded-md border px-2 py-0.5 font-display ${R.text} ${R.soft}`}>{f.rank}</span>
                  <span className={`text-xs font-bold ${R.text}`}>{R.label}</span>
                  <span className="ml-auto grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground group-hover:text-gold">↗</span>
                </div>
                <div className="mt-5 flex items-center gap-4">
                  {f.avatar ? <img src={f.avatar} alt={f.name} className="h-14 w-14 rounded-xl object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-gold to-rank-f font-display text-2xl text-primary-foreground">{f.name[0]?.toUpperCase()}</div>}
                  <div><h3 className="text-xl font-bold">{f.name}</h3><p className="text-sm text-muted-foreground">{f.role || "—"}</p></div>
                </div>
                <dl className="mt-5 space-y-2 text-sm">
                  {[["SteamID", f.steam], ["Discord ID", f.discord], ["Statut", f.blacklisted ? "Blacklisté" : "Non blacklisté"], ["Badges", String(f.badges.length)], ["Avertissements", String(f.warnings.length)]].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border pb-2"><dt className="text-muted-foreground">{k}</dt><dd className={k === "Statut" && f.blacklisted ? "font-bold text-rank-s" : "font-medium"}>{v || "—"}</dd></div>
                  ))}
                </dl>
                <div className="mt-4 text-sm font-bold text-gold">Consulter la fiche →</div>
              </Link>); })}
          </div>
        </div>
      </section>

    </main>
  );
}

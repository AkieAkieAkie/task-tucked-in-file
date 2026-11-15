import { useEffect, useState } from "react";

export const RANKS = {
  E: { label: "Exceptionnel", tier: "Légende", text: "text-rank-e", bg: "bg-rank-e", soft: "border-rank-e/50 bg-rank-e/10", grad: "from-rank-e" },
  M: { label: "Très bien", tier: "Excellence", text: "text-rank-m", bg: "bg-rank-m", soft: "border-rank-m/50 bg-rank-m/10", grad: "from-rank-m" },
  A: { label: "Bien", tier: "Solide", text: "text-rank-a", bg: "bg-rank-a", soft: "border-rank-a/50 bg-rank-a/10", grad: "from-rank-a" },
  T: { label: "Neutre", tier: "Neutre", text: "text-rank-t", bg: "bg-rank-t", soft: "border-rank-t/50 bg-rank-t/10", grad: "from-rank-t" },
  F: { label: "Médiocre", tier: "Fragile", text: "text-rank-f", bg: "bg-rank-f", soft: "border-rank-f/50 bg-rank-f/10", grad: "from-rank-f" },
  S: { label: "Danger / blacklist", tier: "Danger", text: "text-rank-s", bg: "bg-rank-s", soft: "border-rank-s/50 bg-rank-s/10", grad: "from-rank-s" },
} as const;
export type Rank = keyof typeof RANKS;
export type Item = { id: string; date: string; title: string; note: string; kind?: "ecrit" | "oral"; until?: string; by?: string };
export const WARN = { ecrit: { label: "Écrit", desc: "grave", text: "text-rank-s", bg: "bg-rank-s", soft: "border-rank-s/40 bg-rank-s/10", bar: "border-l-rank-s" }, oral: { label: "Oral", desc: "léger", text: "text-oral", bg: "bg-oral", soft: "border-oral/40 bg-oral/10", bar: "border-l-oral" } } as const;
export const today = () => new Date().toISOString().slice(0, 10);
export const isActive = (w: Item) => !!w.until && w.until >= today();
export const daysLeft = (w: Item) => Math.round((new Date(w.until!).getTime() - new Date(today()).getTime()) / 864e5);
export type Friend = {
  id: string; name: string; role: string; group: string; ig: string; phone: string;
  since: string; rank: Rank; blacklisted: boolean; avatar: string; review: string; remark: string;
  history: Item[]; badges: Item[]; warnings: Item[]; photos: string[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const blankFriend = (): Friend => ({
  id: uid(), name: "Nouvel ami", role: "", group: "", ig: "", phone: "", since: "", rank: "T",
  blacklisted: false, avatar: "", review: "", remark: "", history: [], badges: [], warnings: [], photos: [],
});

const SAMPLE: Friend[] = [
  { ...blankFriend(), id: "leo", name: "Leo Tek", role: "Meilleur pote", group: "Lycée", since: "2026-09-21", rank: "M",
    review: "Toujours là quand on a besoin de lui, drôle et fiable. Un vrai pilier du groupe.", remark: "Ami depuis la seconde",
    history: [{ id: "h1", date: "2026-09-21", title: "Rencontre", note: "En cours de maths" }, { id: "h2", date: "2026-10-17", title: "Premier voyage ensemble", note: "Week-end à la mer" }],
    badges: [{ id: "b1", date: "2026-10-04", title: "Rookie", note: "" }],
    warnings: [{ id: "w1", date: "2026-11-10", title: "En retard au ciné", note: "", kind: "oral", until: "2026-12-10", by: "Moi" }] },
  { ...blankFriend(), id: "aziz", name: "Aziz Nashia", role: "Pote de jeu", group: "Discord", rank: "A" },
  { ...blankFriend(), id: "mike", name: "Mike Avilso", role: "Connaissance", group: "Foot", rank: "F", warnings: [{ id: "w2", date: "2026-11-14", title: "A balancé un secret", note: "", kind: "ecrit", until: "2026-12-14", by: "Moi" }] },
];

const KEY = "mes-amis-fiches-v4";
const read = (): Friend[] => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : SAMPLE; } catch { return SAMPLE; } };

export function useFriends() {
  const [list, setList] = useState<Friend[]>(SAMPLE);
  const [ready, setReady] = useState(false);
  useEffect(() => { setList(read()); setReady(true); }, []);
  const save = (l: Friend[]) => {
    setList(l);
    try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { alert("Stockage plein : supprime quelques photos."); }
  };
  return { list, ready, save };
}

export function fileToDataUrl(file: File, max = 800): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

export const fmt = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

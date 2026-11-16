import { useEffect, useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { directoryQuery } from "./directory-query";
import { saveDirectory } from "./friends.functions";
import { friendSchema } from "./friend-schema";

export const RANKS = {
  E: { label: "Exceptionnel", tier: "Légende", text: "text-rank-e", bg: "bg-rank-e", soft: "border-rank-e/50 bg-rank-e/10", grad: "from-rank-e" },
  M: { label: "Très bien", tier: "Excellence", text: "text-rank-m", bg: "bg-rank-m", soft: "border-rank-m/50 bg-rank-m/10", grad: "from-rank-m" },
  A: { label: "Bien", tier: "Solide", text: "text-rank-a", bg: "bg-rank-a", soft: "border-rank-a/50 bg-rank-a/10", grad: "from-rank-a" },
  T: { label: "Neutre", tier: "Neutre", text: "text-rank-t", bg: "bg-rank-t", soft: "border-rank-t/50 bg-rank-t/10", grad: "from-rank-t" },
  F: { label: "Médiocre", tier: "Fragile", text: "text-rank-f", bg: "bg-rank-f", soft: "border-rank-f/50 bg-rank-f/10", grad: "from-rank-f" },
  S: { label: "Danger / blacklist", tier: "Danger", text: "text-rank-s", bg: "bg-rank-s", soft: "border-rank-s/50 bg-rank-s/10", grad: "from-rank-s" },
} as const;
export type Rank = keyof typeof RANKS;
export type Item = { id: string; date: string; title: string; note: string; kind?: "ecrit" | "oral" | undefined; until?: string | undefined; by?: string | undefined };
export const WARN = { ecrit: { label: "Écrit", desc: "grave", text: "text-rank-s", bg: "bg-rank-s", soft: "border-rank-s/40 bg-rank-s/10", bar: "border-l-rank-s" }, oral: { label: "Oral", desc: "léger", text: "text-oral", bg: "bg-oral", soft: "border-oral/40 bg-oral/10", bar: "border-l-oral" } } as const;
export const today = () => new Date().toISOString().slice(0, 10);
export const isActive = (w: Item) => !!w.until && w.until >= today();
export const daysLeft = (w: Item) => w.until ? Math.round((new Date(w.until).getTime() - new Date(today()).getTime()) / 864e5) : 0;
export type Info = { id: string; label: string; value: string; image: string };
export type Friend = {
  infos?: Info[] | undefined;
  id: string; name: string; role: string; group: string; ig: string; phone: string;
  since: string; rank: Rank; blacklisted: boolean; avatar: string; review: string; remark: string;
  history: Item[]; badges: Item[]; warnings: Item[]; photos: string[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const blankFriend = (): Friend => ({
  id: uid(), name: "Nouvel ami", role: "", group: "", ig: "", phone: "", since: "", rank: "T",
  blacklisted: false, avatar: "", review: "", remark: "", history: [], badges: [], warnings: [], photos: [],
});

const KEY = "mes-amis-fiches-v4";

export function useFriends() {
  const client = useQueryClient();
  const { data } = useSuspenseQuery(directoryQuery);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<Friend[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      const parsed = friendSchema.array().safeParse(stored ? JSON.parse(stored) : []);
      if (parsed.success) setLocal(parsed.data);
    } catch { /* Keep existing storage untouched if unreadable. */ }
  }, []);
  const save = async (l: Friend[], version = data.version) => {
    if (saving) return false;
    setSaving(true);
    try {
      const result = await saveDirectory({ data: { friends: l, version } });
      if (!result.ok) {
        toast.error("Une modification a été faite sur un autre appareil. Annule puis rouvre la fiche avant de réessayer.");
        await client.invalidateQueries({ queryKey: directoryQuery.queryKey });
        return false;
      }
      client.setQueryData(directoryQuery.queryKey, result.directory);
      toast.success("Enregistré en ligne");
      return true;
    } catch {
      toast.error("Enregistrement impossible. Vérifie ta connexion et ton accès admin, puis réessaie ; tes modifications restent ouvertes.");
      return false;
    } finally { setSaving(false); }
  };
  const importLocal = async () => {
    const ids = new Set(data.friends.map((f) => f.id));
    if (await save([...data.friends, ...local.filter((f) => !ids.has(f.id))])) {
      setLocal([]);
      try { localStorage.removeItem(KEY); } catch { /* Import is already safely online. */ }
    }
  };
  return { list: data.friends, ready: true, save, saving, version: data.version, localCount: local.filter((f) => !data.friends.some((x) => x.id === f.id)).length, importLocal };
}

export function fileToDataUrl(file: File, max = 800): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k;
      const context = c.getContext("2d");
      if (!context) return;
      context.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = URL.createObjectURL(file);
  });
}

export const fmt = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

import { createServerFn } from "@tanstack/react-start";
import { friendSchema, requireDirectoryAccess, saveDirectorySchema } from "./friend-schema";

export const getDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { readGateAccess } = await import("./gate.server");
  requireDirectoryAccess(await readGateAccess());
  const { readDirectory } = await import("./store.server");
  let data;
  try { data = await readDirectory(); } catch (e) {
    if (e instanceof Error && e.message.startsWith("Base de données")) throw e;
    throw new Error("Impossible de charger les fiches. Réessaie avec une connexion internet.");
  }
  return { friends: friendSchema.array().parse(data?.friends ?? []), version: data?.version ?? 0 };
});

export const saveDirectory = createServerFn({ method: "POST" })
  .validator((input: unknown) => saveDirectorySchema.parse(input))
  .handler(async ({ data }) => {
    const { readGateAccess } = await import("./gate.server");
    requireDirectoryAccess(await readGateAccess(), true);
    const { writeDirectory } = await import("./store.server");
    let r;
    try { r = await writeDirectory(data.friends, data.version); } catch { throw new Error("Enregistrement impossible. Tes modifications restent ouvertes ; réessaie."); }
    if (r === "conflict") return { ok: false as const, conflict: true };
    return { ok: true as const, directory: { friends: data.friends, version: data.version + 1 } };
  });

async function requireAdmin() {
  const { readGateAccess } = await import("./gate.server");
  requireDirectoryAccess(await readGateAccess(), true);
}
export const listBackups = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { listSnapshots } = await import("./store.server");
  return listSnapshots();
});
export const getBackup = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { readSnapshot } = await import("./store.server");
    const s = await readSnapshot(data.id);
    if (!s) throw new Error("Sauvegarde introuvable.");
    return { friends: friendSchema.array().parse(s.friends), version: s.version, created_at: s.created_at };
  });
export const createBackup = createServerFn({ method: "POST" })
  .validator((d: { label: string }) => ({ label: String(d.label ?? "").slice(0, 80) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { readDirectory, addSnapshot } = await import("./store.server");
    const cur = await readDirectory();
    await addSnapshot("manual", data.label, cur?.friends ?? [], cur?.version ?? 0);
    return { ok: true as const };
  });

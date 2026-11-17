import { createServerFn } from "@tanstack/react-start";
import { getAccess } from "./gate.functions";
import { friendSchema, requireDirectoryAccess, saveDirectorySchema } from "./friend-schema";

export const getDirectory = createServerFn({ method: "GET" }).handler(async () => {
  requireDirectoryAccess(await getAccess());
  const { readDirectory } = await import("./store.server");
  let data;
  try { data = await readDirectory(); } catch { throw new Error("Impossible de charger les fiches. Réessaie avec une connexion internet."); }
  return { friends: friendSchema.array().parse(data?.friends ?? []), version: data?.version ?? 0 };
});

export const saveDirectory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveDirectorySchema.parse(input))
  .handler(async ({ data }) => {
    requireDirectoryAccess(await getAccess(), true);
    const { writeDirectory } = await import("./store.server");
    let r;
    try { r = await writeDirectory(data.friends, data.version); } catch { throw new Error("Enregistrement impossible. Tes modifications restent ouvertes ; réessaie."); }
    if (r === "conflict") return { ok: false as const, conflict: true };
    return { ok: true as const, directory: { friends: data.friends, version: data.version + 1 } };
  });

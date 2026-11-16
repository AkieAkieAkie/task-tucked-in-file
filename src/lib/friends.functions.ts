import { createServerFn } from "@tanstack/react-start";
import { getAccess } from "./gate.functions";
import { friendSchema, requireDirectoryAccess, saveDirectorySchema } from "./friend-schema";

export const getDirectory = createServerFn({ method: "GET" }).handler(async () => {
  requireDirectoryAccess(await getAccess());
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("friend_directory").select("friends, version").eq("id", "shared").maybeSingle();
  if (error) throw new Error("Impossible de charger les fiches. Réessaie avec une connexion internet.");
  return { friends: friendSchema.array().parse(data?.friends ?? []), version: data?.version ?? 0 };
});

export const saveDirectory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveDirectorySchema.parse(input))
  .handler(async ({ data }) => {
    requireDirectoryAccess(await getAccess(), true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { friends: data.friends, version: data.version + 1, updated_at: new Date().toISOString() };
    if (data.version === 0) {
      const { error } = await supabaseAdmin.from("friend_directory").insert({ id: "shared", ...row });
      if (error?.code === "23505") return { ok: false as const, conflict: true };
      if (error) throw new Error("Enregistrement impossible. Tes modifications restent ouvertes ; réessaie.");
    } else {
      const { data: updated, error } = await supabaseAdmin.from("friend_directory").update(row).eq("id", "shared").eq("version", data.version).select("version").maybeSingle();
      if (error) throw new Error("Enregistrement impossible. Tes modifications restent ouvertes ; réessaie.");
      if (!updated) return { ok: false as const, conflict: true };
    }
    return { ok: true as const, directory: { friends: data.friends, version: row.version } };
  });
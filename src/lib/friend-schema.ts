import { z } from "zod";

const item = z.object({
  id: z.string(), date: z.string(), title: z.string(), note: z.string(),
  kind: z.enum(["ecrit", "oral"]).optional(), until: z.string().optional(), by: z.string().optional(),
});
export const friendSchema = z.object({
  id: z.string().min(1), name: z.string(), role: z.string(), group: z.string(), ig: z.string(), phone: z.string(),
  since: z.string(), rank: z.enum(["E", "M", "A", "T", "F", "S"]), blacklisted: z.boolean(),
  avatar: z.string(), review: z.string(), remark: z.string(), history: z.array(item), badges: z.array(item),
  warnings: z.array(item), photos: z.array(z.string()),
  infos: z.array(z.object({ id: z.string(), label: z.string(), value: z.string(), image: z.string() })).optional(),
});
export const saveDirectorySchema = z.object({
  friends: z.array(friendSchema), version: z.number().int().nonnegative(),
}).refine(({ friends }) => new Set(friends.map((f) => f.id)).size === friends.length, "Identifiants dupliqués");

export function requireDirectoryAccess(access: { site?: boolean; admin?: boolean }, write = false) {
  if (!access.site || (write && !access.admin)) throw new Error("Accès refusé. Entre le code d’accès requis.");
}
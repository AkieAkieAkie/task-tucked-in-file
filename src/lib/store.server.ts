// Data access: uses a self-hosted PostgreSQL when DATABASE_URL is set (VPS), otherwise Lovable Cloud.
type Dir = { friends: unknown; version: number } | null;
type Code = { salt: string; hash: string } | null;

import { databaseHint } from "./config-check";

let sqlClient: any;
async function pg() {
  const url = process.env["DATABASE_URL"];
  if (!url) return null;
  if (!sqlClient) {
    const { default: postgres } = await import("postgres");
    const raw: any = postgres(url, { max: 5 });
    // Log the real driver error server-side, surface only a French hint to the page.
    sqlClient = Object.assign(
      (strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]> =>
        Promise.resolve(raw(strings, ...values)).catch((error: unknown) => { console.error(error); throw new Error(databaseHint(error)); }),
      { json: raw.json.bind(raw) },
    );
  }
  return sqlClient;
}
const cloud = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

export async function readDirectory(): Promise<Dir> {
  const sql = await pg();
  if (sql) { const r = await sql`select friends, version from friend_directory where id = 'shared'`; return r[0] ?? null; }
  const { data, error } = await (await cloud()).from("friend_directory").select("friends, version").eq("id", "shared").maybeSingle();
  if (error) throw error;
  return data;
}

/** Returns "ok", "conflict" or throws. */
export async function writeDirectory(friends: unknown[], prev: number): Promise<"ok" | "conflict"> {
  const version = prev + 1, updated_at = new Date().toISOString();
  const sql = await pg();
  if (sql) {
    const json = sql.json(friends);
    if (prev === 0) {
      const r = await sql`insert into friend_directory (id, friends, version, updated_at) values ('shared', ${json}, ${version}, ${updated_at}) on conflict (id) do nothing returning id`;
      return r.length ? "ok" : "conflict";
    }
    const r = await sql`update friend_directory set friends = ${json}, version = ${version}, updated_at = ${updated_at} where id = 'shared' and version = ${prev} returning id`;
    return r.length ? "ok" : "conflict";
  }
  const db = await cloud();
  const row = { friends: friends as never, version, updated_at };
  if (prev === 0) {
    const { error } = await db.from("friend_directory").insert({ id: "shared", ...row });
    if (error?.code === "23505") return "conflict";
    if (error) throw error;
    return "ok";
  }
  const { data, error } = await db.from("friend_directory").update(row).eq("id", "shared").eq("version", prev).select("version").maybeSingle();
  if (error) throw error;
  return data ? "ok" : "conflict";
}

export async function readCode(level: string): Promise<Code> {
  const sql = await pg();
  if (sql) { const r = await sql`select salt, hash from access_codes where level = ${level}`; return r[0] ?? null; }
  const { data } = await (await cloud()).from("access_codes").select("salt, hash").eq("level", level).maybeSingle();
  return data;
}

export async function writeCode(level: "site" | "admin", salt: string, hash: string) {
  const sql = await pg();
  if (sql) { await sql`insert into access_codes (level, salt, hash, updated_at) values (${level}, ${salt}, ${hash}, now()) on conflict (level) do update set salt = excluded.salt, hash = excluded.hash, updated_at = now()`; return; }
  const { error } = await (await cloud()).from("access_codes").upsert({ level, salt, hash, updated_at: new Date().toISOString() });
  if (error) throw error;
}

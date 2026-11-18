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
  if (prev > 0) {
    // Keep the state being replaced so an admin can restore it; never block the save on this.
    try { const cur = await readDirectory(); if (cur && cur.version === prev) await addSnapshot("auto", "", cur.friends, prev); } catch (e) { console.error(e); }
  }
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

// ---- Snapshots (automatic before each write, manual on demand) ----
export type SnapMeta = { id: string; kind: "auto" | "manual"; label: string; version: number; created_at: string; count: number };
const AUTO_KEEP = 100;

export async function addSnapshot(kind: "auto" | "manual", label: string, friends: unknown, version: number) {
  const sql = await pg();
  if (sql) {
    await sql`create table if not exists directory_snapshots (id uuid primary key default gen_random_uuid(), kind text not null, label text not null default '', friends jsonb not null, version integer not null, created_at timestamptz not null default now())`;
    await sql`insert into directory_snapshots (kind, label, friends, version) values (${kind}, ${label}, ${sql.json(friends)}, ${version})`;
    if (kind === "auto") await sql`delete from directory_snapshots where kind = 'auto' and id not in (select id from directory_snapshots where kind = 'auto' order by created_at desc limit ${AUTO_KEEP})`;
    return;
  }
  const db = await cloud();
  const { error } = await db.from("directory_snapshots").insert({ kind, label, friends: friends as never, version });
  if (error) throw error;
  if (kind === "auto") {
    const { data } = await db.from("directory_snapshots").select("id").eq("kind", "auto").order("created_at", { ascending: false }).range(AUTO_KEEP, AUTO_KEEP + 500);
    if (data?.length) await db.from("directory_snapshots").delete().in("id", data.map((r) => r.id));
  }
}

export async function listSnapshots(): Promise<SnapMeta[]> {
  const sql = await pg();
  let rows: any[];
  if (sql) {
    await sql`create table if not exists directory_snapshots (id uuid primary key default gen_random_uuid(), kind text not null, label text not null default '', friends jsonb not null, version integer not null, created_at timestamptz not null default now())`;
    rows = await sql`select id, kind, label, version, created_at, jsonb_array_length(friends) as count from directory_snapshots order by created_at desc limit 200`;
  } else {
    const { data, error } = await (await cloud()).from("directory_snapshots").select("id, kind, label, version, created_at, friends").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    rows = (data ?? []).map((r) => ({ ...r, count: Array.isArray(r.friends) ? r.friends.length : 0 }));
  }
  return rows.map((r) => ({ id: String(r.id), kind: r.kind, label: r.label, version: Number(r.version), created_at: new Date(r.created_at).toISOString(), count: Number(r.count) }));
}

export async function readSnapshot(id: string): Promise<{ friends: unknown; version: number; created_at: string } | null> {
  const sql = await pg();
  if (sql) { const r = await sql`select friends, version, created_at from directory_snapshots where id = ${id}`; return r[0] ? { ...r[0], created_at: new Date(r[0].created_at).toISOString() } : null; }
  const { data, error } = await (await cloud()).from("directory_snapshots").select("friends, version, created_at").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

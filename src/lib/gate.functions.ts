import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

type GateSession = { site?: boolean; admin?: boolean };
const cfg = () => ({
  password: process.env['SESSION_SECRET']!,
  name: "cercle-gate",
  maxAge: 60 * 60 * 24 * 30,
  cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
});

function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function hashCode(code: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100_000 }, key, 256);
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function checkCode(level: "site" | "admin", code: string) {
  const { readCode } = await import("./store.server");
  const data = await readCode(level);
  if (data) return safeEqual(await hashCode(code, data.salt), data.hash);
  const expected = level === "site" ? process.env['SITE_PASSWORD'] : process.env['ADMIN_PASSWORD'];
  return !!expected && safeEqual(code, expected);
}

export const changeCode = createServerFn({ method: "POST" })
  .validator((d: { level: "site" | "admin"; current: string; next: string }) => d)
  .handler(async ({ data }) => {
    const s = await useSession<GateSession>(cfg());
    if (!s.data.site || !s.data.admin) return { ok: false as const, error: "Accès admin requis." };
    const next = String(data.next);
    if (next.length < 4 || next.length > 64) return { ok: false as const, error: "Le nouveau code doit faire entre 4 et 64 caractères." };
    if (!(await checkCode("admin", String(data.current)))) return { ok: false as const, error: "Code admin actuel incorrect." };
    const salt = crypto.randomUUID();
    const { writeCode } = await import("./store.server");
    try { await writeCode(data.level, salt, await hashCode(next, salt)); } catch {
      return { ok: false as const, error: "Enregistrement impossible, réessaie." };
    }
    return { ok: true as const };
  });

export const getAccess = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<GateSession>(cfg());
  return { site: !!s.data.site, admin: !!s.data.site && !!s.data.admin };
});

export const unlock = createServerFn({ method: "POST" })
  .validator((d: { level: "site" | "admin"; code: string }) => d)
  .handler(async ({ data }) => {
    if (!(await checkCode(data.level, String(data.code)))) return { ok: false };
    const s = await useSession<GateSession>(cfg());
    await s.update({ ...s.data, [data.level]: true, ...(data.level === "admin" ? { site: true } : {}) });
    return { ok: true };
  });

export const lock = createServerFn({ method: "POST" })
  .validator((d: { level: "site" | "admin" }) => d)
  .handler(async ({ data }) => {
    const s = await useSession<GateSession>(cfg());
    if (data.level === "site") await s.clear();
    else await s.update({ ...s.data, admin: false });
    return { ok: true };
  });

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

export const getAccess = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<GateSession>(cfg());
  return { site: !!s.data.site, admin: !!s.data.site && !!s.data.admin };
});

export const unlock = createServerFn({ method: "POST" })
  .validator((d: { level: "site" | "admin"; code: string }) => d)
  .handler(async ({ data }) => {
    const expected = data.level === "site" ? process.env['SITE_PASSWORD'] : process.env['ADMIN_PASSWORD'];
    if (!expected || !safeEqual(String(data.code), expected)) return { ok: false };
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

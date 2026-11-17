import { useSession } from "@tanstack/react-start/server";
import { sessionAccess, type GateSession } from "./session-policy";

export function gateSession() {
  const password = process.env['SESSION_SECRET'];
  if (!password) throw new Error("Réglages du serveur incomplets.");
  return useSession<GateSession>({
    password,
    name: "cercle-gate",
    maxAge: 15 * 60,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}

export async function readGateAccess() {
  const session = await gateSession();
  const serverNow = Date.now();
  const access = sessionAccess(session.data, serverNow);
  if (!access.site && (session.data.site || session.data.admin)) await session.clear();
  return { ...access, serverNow, expiresAt: access.site ? session.data.expiresAt ?? null : null };
}
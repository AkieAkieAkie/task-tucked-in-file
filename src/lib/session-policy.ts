export const SESSION_INTERVAL_MS = 15 * 60 * 1000;

export type GateSession = { site?: boolean; admin?: boolean; expiresAt?: number };

export function nextSessionBoundary(now: number) {
  return (Math.floor(now / SESSION_INTERVAL_MS) + 1) * SESSION_INTERVAL_MS;
}

export function sessionAccess(session: GateSession, now: number) {
  const site = session.site === true && typeof session.expiresAt === "number" && now < session.expiresAt;
  return { site, admin: site && session.admin === true };
}
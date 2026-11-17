import { describe, expect, it } from "vitest";
import { nextSessionBoundary, sessionAccess, SESSION_INTERVAL_MS } from "@/lib/session-policy";

describe("Quarter-hour sessions", () => {
  it("uses exactly fifteen minutes", () => {
    expect(SESSION_INTERVAL_MS).toBe(900_000);
  });
  it("closes sessions opened on different devices at the same quarter hour", () => {
    const start = Date.parse("2026-11-17T01:00:00Z");
    expect(nextSessionBoundary(start + 60_000)).toBe(start + 900_000);
    expect(nextSessionBoundary(start + 840_000)).toBe(start + 900_000);
  });
  it("rejects both site and admin access at the boundary, even with an old cookie", () => {
    const session = { site: true, admin: true, expiresAt: 900_000 };
    expect(sessionAccess(session, 899_999)).toEqual({ site: true, admin: true });
    expect(sessionAccess(session, 900_000)).toEqual({ site: false, admin: false });
  });
  it("rejects legacy sessions without a deadline", () => {
    expect(sessionAccess({ site: true, admin: true }, 1)).toEqual({ site: false, admin: false });
  });
});
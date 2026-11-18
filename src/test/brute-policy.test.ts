import { describe, expect, it } from "vitest";
import { afterFailure, isBlocked } from "@/lib/brute-policy";
const H = 3600_000, now = 1_000_000_000_000;
describe("Code brute-force blocking", () => {
  it("does not block before the third wrong code", () => {
    const s = afterFailure(afterFailure(null, now), now);
    expect(isBlocked(s, now)).toBe(false);
  });
  it("blocks 24 hours on the third wrong code", () => {
    const s = afterFailure(afterFailure(afterFailure(null, now), now), now);
    expect(s.blockedUntil).toBe(now + 24 * H);
  });
  it("adds 6 hours for each wrong code while blocked", () => {
    let s = afterFailure(afterFailure(afterFailure(null, now), now), now);
    s = afterFailure(s, now + H); s = afterFailure(s, now + 2 * H);
    expect(s.blockedUntil).toBe(now + 36 * H);
  });
  it("starts counting again after the block ends", () => {
    const s = afterFailure({ failures: 3, blockedUntil: now - 1 }, now);
    expect(s).toEqual({ failures: 1, blockedUntil: null });
  });
});

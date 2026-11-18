export const MAX_FAILURES = 3;
export const FIRST_BLOCK_MS = 24 * 3600_000;
export const EXTRA_BLOCK_MS = 6 * 3600_000;
export type BlockState = { failures: number; blockedUntil: number | null };

export const isBlocked = (s: BlockState | null, now: number) => !!s?.blockedUntil && s.blockedUntil > now;

/** State after one wrong code: 3rd failure blocks 24 h; each wrong code while blocked adds 6 h. */
export function afterFailure(s: BlockState | null, now: number): BlockState {
  if (s && isBlocked(s, now)) return { failures: s.failures + 1, blockedUntil: s.blockedUntil! + EXTRA_BLOCK_MS };
  const failures = (s && s.blockedUntil && s.blockedUntil <= now ? 0 : s?.failures ?? 0) + 1;
  return { failures, blockedUntil: failures >= MAX_FAILURES ? now + FIRST_BLOCK_MS : null };
}

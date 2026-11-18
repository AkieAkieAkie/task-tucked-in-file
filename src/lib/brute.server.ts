import { getCookie, getRequestIP, setCookie } from "@tanstack/react-start/server";
import { afterFailure, isBlocked } from "./brute-policy";
import { readBlock, writeBlock } from "./store.server";

function keys() {
  let dev = getCookie("cercle-device");
  if (!dev || !/^[0-9a-f-]{36}$/.test(dev)) {
    dev = crypto.randomUUID();
    setCookie("cercle-device", dev, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 5 });
  }
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  return [`ip:${ip}`, `dev:${dev}`];
}

/** Runs the code check unless blocked; blocked callers always get "wrong code". */
export async function guardedCheck(check: () => Promise<boolean>): Promise<boolean> {
  const ks = keys(), now = Date.now();
  const states = await Promise.all(ks.map((k) => readBlock(k).catch(() => null)));
  const blocked = states.some((s) => isBlocked(s, now));
  const ok = !blocked && (await check());
  if (ok) { await Promise.all(ks.map((k) => writeBlock(k, null).catch(() => {}))); return true; }
  // Failure (or any attempt while blocked counted as wrong): every key gets the stricter state.
  const worst = states.find((s) => isBlocked(s, now)) ?? null;
  await Promise.all(ks.map((k, i) => writeBlock(k, afterFailure(worst ?? states[i] ?? null, now)).catch((e) => console.error(e))));
  return false;
}

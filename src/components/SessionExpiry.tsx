import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lock } from "@/lib/gate.functions";
import { useSessionLifecycle } from "@/lib/session-lifecycle";

export function SessionExpiry({ expiresAt, serverNow, onExpire }: { expiresAt: number; serverNow: number; onExpire: () => void }) {
  const lifecycle = useSessionLifecycle();
  const router = useRouter();
  const logout = useServerFn(lock);
  useEffect(() => {
    // A monotonic clock prevents a changed device clock from extending access.
    const started = performance.now();
    const remaining = expiresAt - serverNow;
    let expired = false;
    let prepared = false;
    const tick = () => {
      const left = remaining - (performance.now() - started);
      if (left <= 5000 && !prepared) {
        prepared = true;
        void Promise.allSettled([...lifecycle.saves].map((save) => save()));
      }
      if (left <= 0 && !expired) {
        expired = true;
        onExpire();
        router.options.context.queryClient.removeQueries({ queryKey: ["friend-directory"] });
        void logout({ data: { level: "site" } }).catch(() => undefined).finally(() => router.invalidate());
      }
    };
    const timer = window.setInterval(tick, 250);
    const deadline = window.setTimeout(tick, Math.max(0, remaining));
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    tick();
    return () => {
      clearInterval(timer); clearTimeout(deadline);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [expiresAt, serverNow, lifecycle, router, logout, onExpire]);
  return null;
}
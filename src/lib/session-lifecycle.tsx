import { createContext, useContext, useRef, type ReactNode } from "react";
import type { Friend } from "./friends";

export type PendingDraft = { friend: Friend; list: Friend[]; version: number };
type Lifecycle = {
  drafts: Map<string, PendingDraft>;
  saves: Set<() => Promise<boolean>>;
};
const Context = createContext<Lifecycle | null>(null);

export function SessionLifecycleProvider({ children }: { children: ReactNode }) {
  const value = useRef<Lifecycle>({ drafts: new Map(), saves: new Set() });
  return <Context.Provider value={value.current}>{children}</Context.Provider>;
}

export function useSessionLifecycle() {
  const value = useContext(Context);
  if (!value) throw new Error("Session lifecycle provider missing");
  return value;
}
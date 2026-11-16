import { describe, expect, it } from "vitest";
import { requireDirectoryAccess, saveDirectorySchema } from "@/lib/friend-schema";

describe("Shared directory permissions", () => {
  it("rejects reading without the site code session", () => {
    expect(() => requireDirectoryAccess({ site: false, admin: true })).toThrow("Accès refusé");
  });
  it("permits reading with the site code session", () => {
    expect(() => requireDirectoryAccess({ site: true, admin: false })).not.toThrow();
  });
  it("rejects modification with only the site code", () => {
    expect(() => requireDirectoryAccess({ site: true, admin: false }, true)).toThrow("Accès refusé");
  });
  it("permits modification with both code sessions", () => {
    expect(() => requireDirectoryAccess({ site: true, admin: true }, true)).not.toThrow();
  });
  it("requires the saved directory version", () => {
    expect(saveDirectorySchema.safeParse({ friends: [] }).success).toBe(false);
    expect(saveDirectorySchema.parse({ friends: [], version: 0 }).version).toBe(0);
  });
});
import { describe, expect, it } from "vitest";
import {
  createChunkedStorage,
  SECURE_STORE_CHUNK_SIZE,
  splitStorageValue,
} from "./secure-storage-core";

describe("mobile secure storage helpers", () => {
  it("splits and preserves realistic Supabase session values", () => {
    const value = "x".repeat(SECURE_STORE_CHUNK_SIZE * 3 + 17);
    const chunks = splitStorageValue(value);
    expect(chunks).toHaveLength(4);
    expect(chunks.join("")).toBe(value);
  });

  it("round-trips and removes chunked values through the storage adapter", async () => {
    const values = new Map<string, string>();
    const storage = createChunkedStorage({
      getItemAsync: async (key) => values.get(key) ?? null,
      setItemAsync: async (key, value) => void values.set(key, value),
      deleteItemAsync: async (key) => void values.delete(key),
    });
    const value = "session-token".repeat(500);
    await storage.setItem("supabase-session", value);
    await expect(storage.getItem("supabase-session")).resolves.toBe(value);
    await storage.removeItem("supabase-session");
    await expect(storage.getItem("supabase-session")).resolves.toBeNull();
  });
});

// SecureStore values are limited on some native implementations. Keep a
// margin below the limit and store larger Supabase sessions in chunks.
export const SECURE_STORE_CHUNK_SIZE = 1800;

export function splitStorageValue(
  value: string,
  chunkSize = SECURE_STORE_CHUNK_SIZE,
): string[] {
  if (chunkSize < 1) throw new Error("chunkSize must be positive");
  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += chunkSize) {
    chunks.push(value.slice(offset, offset + chunkSize));
  }
  return chunks.length ? chunks : [""];
}

interface StorageLike {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

export function createChunkedStorage(store: StorageLike) {
  const metadataSuffix = ".__chunk_count";
  return {
    async getItem(key: string) {
      const metadata = await store.getItemAsync(key + metadataSuffix);
      if (!metadata) return store.getItemAsync(key);
      const count = Number.parseInt(metadata, 10);
      if (!Number.isSafeInteger(count) || count < 1) return null;
      const chunks = await Promise.all(
        Array.from({ length: count }, (_, index) =>
          store.getItemAsync(`${key}.${index}`),
        ),
      );
      if (chunks.some((chunk) => chunk === null)) return null;
      return chunks.join("");
    },
    async setItem(key: string, value: string) {
      const chunks = splitStorageValue(value);
      const previousMetadata = await store.getItemAsync(key + metadataSuffix);
      const previousCount = previousMetadata
        ? Number.parseInt(previousMetadata, 10)
        : 0;
      await Promise.all(
        chunks.map((chunk, index) =>
          store.setItemAsync(`${key}.${index}`, chunk),
        ),
      );
      await store.setItemAsync(key + metadataSuffix, String(chunks.length));
      // Remove stale chunks after publishing the new complete value.
      if (
        Number.isSafeInteger(previousCount) &&
        previousCount > chunks.length
      ) {
        await Promise.all(
          Array.from({ length: previousCount - chunks.length }, (_, index) =>
            store.deleteItemAsync(`${key}.${chunks.length + index}`),
          ),
        );
      }
      await store.deleteItemAsync(key);
    },
    async removeItem(key: string) {
      const metadata = await store.getItemAsync(key + metadataSuffix);
      const count = metadata ? Number.parseInt(metadata, 10) : 0;
      if (Number.isSafeInteger(count) && count > 0) {
        await Promise.all(
          Array.from({ length: count }, (_, index) =>
            store.deleteItemAsync(`${key}.${index}`),
          ),
        );
      }
      await Promise.all([
        store.deleteItemAsync(key + metadataSuffix),
        store.deleteItemAsync(key),
      ]);
    },
  };
}

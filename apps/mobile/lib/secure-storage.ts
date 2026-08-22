import * as SecureStore from "expo-secure-store";
import { createChunkedStorage } from "./secure-storage-core";
export {
  SECURE_STORE_CHUNK_SIZE,
  splitStorageValue,
} from "./secure-storage-core";

interface SecureStorageLike {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

export function createSecureStorage(
  store: SecureStorageLike = SecureStore,
): ReturnType<typeof createChunkedStorage> {
  return createChunkedStorage(store);
}

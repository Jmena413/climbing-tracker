import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { createSecureStorage } from "./lib/secure-storage";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: false,
          persistSession: true,
          storage: createSecureStorage(),
        },
      })
    : null;

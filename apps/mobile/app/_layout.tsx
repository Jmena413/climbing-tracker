import { Stack } from "expo-router";
import { AuthProvider } from "../components/auth-provider";
export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}

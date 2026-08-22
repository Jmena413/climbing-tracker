import { PRODUCT_NAME } from "@climbing-tracker/config";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable } from "react-native";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../components/auth-provider";
export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  if (loading) {
    return <Loading />;
  }
  if (!user) return <Redirect href="/auth" />;
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View>
        <Text style={styles.eyebrow}>FOUNDATION READY</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {PRODUCT_NAME}
        </Text>
        <Text style={styles.body}>
          Fast bouldering session logging, built for one-handed use at the wall.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>You’re signed in</Text>
        <Text style={styles.body}>{user.email}</Text>
        <Text style={styles.body}>
          Session logging is coming next. Your account is ready.
        </Text>
        {signOutError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {signOutError}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={() => {
            setSigningOut(true);
            setSignOutError(null);
            void signOut()
              .catch((cause: unknown) => {
                setSignOutError(
                  cause instanceof Error
                    ? cause.message
                    : "Could not sign out. Please try again.",
                );
              })
              .finally(() => setSigningOut(false));
          }}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>
            {signingOut ? "Signing out…" : "Sign out"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
function Loading() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <Text style={styles.body}>Restoring your session…</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#101612",
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 48,
    paddingTop: 64,
  },
  eyebrow: {
    color: "#9ee493",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: "#f5f7f4",
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: -3,
    lineHeight: 54,
    marginVertical: 16,
  },
  body: { color: "#c2cec5", fontSize: 18, lineHeight: 28 },
  card: {
    backgroundColor: "#19231c",
    borderColor: "#314436",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: {
    color: "#f5f7f4",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  signOut: {
    alignItems: "center",
    borderColor: "#4a6150",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    minHeight: 46,
    justifyContent: "center",
  },
  signOutText: { color: "#9ee493", fontSize: 16, fontWeight: "700" },
  error: { color: "#ffab9e", fontSize: 15, lineHeight: 21, marginTop: 12 },
});

import { useState } from "react";
import { Redirect } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../components/auth-provider";

type Mode = "sign-in" | "sign-up" | "forgot";

export default function AuthScreen() {
  const {
    user,
    signIn,
    signUp,
    resetPassword,
    error: providerError,
    clearError,
  } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user) return <Redirect href="/" />;

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    clearError();
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "sign-in") {
        await signIn(email, password);
      } else if (mode === "sign-up") {
        const signedIn = await signUp(email, password);
        setMessage(
          signedIn
            ? "Your account is ready."
            : "Check your email to confirm your account. The link opens in your browser; return to this app afterward and sign in.",
        );
      } else {
        await resetPassword(email);
        setMessage(
          "If an account uses that email, we sent a reset link. It opens in your browser; return to this app after choosing a new password.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "sign-in"
      ? "Welcome back"
      : mode === "sign-up"
        ? "Create your account"
        : "Reset your password";
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CLIMBING TRACKER</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {mode === "forgot" && (
          <Text style={styles.body}>
            We’ll email a browser link. We never reveal whether an email is
            registered.
          </Text>
        )}
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#829187"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        {mode !== "forgot" && (
          <TextInput
            autoCapitalize="none"
            autoComplete={mode === "sign-in" ? "password" : "new-password"}
            placeholder="Password (8+ characters)"
            placeholderTextColor="#829187"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        )}
        {(error ?? providerError) && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error ?? providerError}
          </Text>
        )}
        {message && (
          <Text accessibilityRole="text" style={styles.message}>
            {message}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void submit()}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>{busy ? "Working…" : title}</Text>
        </Pressable>
        {mode === "sign-up" && (
          <Text style={styles.helper}>
            A confirmation email is required before protected data is available.
          </Text>
        )}
        <View style={styles.links}>
          {mode === "sign-in" && (
            <>
              <Pressable onPress={() => switchMode("sign-up")}>
                <Text style={styles.link}>Create an account</Text>
              </Pressable>
              <Pressable onPress={() => switchMode("forgot")}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            </>
          )}
          {mode === "sign-up" && (
            <Pressable onPress={() => switchMode("sign-in")}>
              <Text style={styles.link}>Already registered? Sign in</Text>
            </Pressable>
          )}
          {mode === "forgot" && (
            <>
              <Pressable onPress={() => switchMode("sign-in")}>
                <Text style={styles.link}>Back to sign in</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#101612",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#19231c",
    borderColor: "#314436",
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
  },
  eyebrow: {
    color: "#9ee493",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: "#f5f7f4",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 20,
    marginTop: 10,
  },
  body: { color: "#c2cec5", fontSize: 16, lineHeight: 23, marginBottom: 12 },
  input: {
    backgroundColor: "#101612",
    borderColor: "#4a6150",
    borderRadius: 8,
    borderWidth: 1,
    color: "#f5f7f4",
    fontSize: 17,
    marginBottom: 12,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  primary: {
    alignItems: "center",
    backgroundColor: "#9ee493",
    borderRadius: 8,
    minHeight: 52,
    justifyContent: "center",
    marginTop: 4,
  },
  primaryText: { color: "#102015", fontSize: 17, fontWeight: "700" },
  error: { color: "#ffab9e", fontSize: 15, lineHeight: 21, marginBottom: 12 },
  message: { color: "#b6e8ac", fontSize: 15, lineHeight: 21, marginBottom: 12 },
  helper: { color: "#a9b8ac", fontSize: 13, lineHeight: 19, marginTop: 12 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 18 },
  link: { color: "#9ee493", fontSize: 15, textDecorationLine: "underline" },
});

import { PRODUCT_NAME } from "@climbing-tracker/config";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
export default function Home() {
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
        <Text style={styles.cardTitle}>Authentication setup</Text>
        <Text style={styles.body}>
          Configure the Expo Supabase variables to connect the shared identity
          provider.
        </Text>
      </View>
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
});

import { View, Text, StyleSheet, Switch, Button } from "react-native";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { Redirect } from "expo-router";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const handleLogout = async () => {
    await signOut(auth);
    setSignedOut(true);
  };

  if (signedOut) return <Redirect href="/" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ Settings</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Enable Notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: { fontSize: 16 },
});

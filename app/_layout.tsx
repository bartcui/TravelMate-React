import { Stack, Redirect, usePathname } from "expo-router";
import { TripProvider } from "../contexts/TripContext";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });
    return unsub;
  }, []);

  if (checkingAuth)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );

  if (!user && !pathname.startsWith("/auth")) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <TripProvider>
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen name="index" options={{ title: "Home" }} />
        <Stack.Screen name="trips/create" options={{ title: "Create Trip" }} />
        <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
      </Stack>
    </TripProvider>
  );
}

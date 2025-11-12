import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { TripProvider } from "../contexts/TripContext";
import { UserProvider, useUser } from "../contexts/UserContext";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { ActivityIndicator, View } from "react-native";

function Gate({ children }: { children: React.ReactNode }) {
  const { profile, isLoaded } = useUser();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!profile && !inOnboarding) {
      router.replace("/onboarding");
    }
    if (profile && inOnboarding) {
      router.replace("/");
    }
  }, [profile, isLoaded, router, segments]);

  if (!isLoaded) return null; // splash could go here
  return <>{children}</>;
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const segments = useSegments(); // e.g. ["(auth)", "login"]
  const inAuthGroup = segments[0] === "(auth)";

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

  if (!user && !inAuthGroup) {
    return <Redirect href="/login" />;
  }

  return (
    <UserProvider>
      <TripProvider>
        <Gate>
          <Stack screenOptions={{ headerShadowVisible: false }}>
            <Stack.Screen name="index" options={{ title: "Home" }} />
            <Stack.Screen name="onboarding" options={{ title: "Welcome" }} />
            <Stack.Screen name="trips/create" options={{ title: "Create Trip" }} />
            <Stack.Screen name="trips/[id]/index" options={{ title: "Trip" }} />
            <Stack.Screen name="trips/[id]/edit" options={{ title: "Edit Trip" }} />
            <Stack.Screen name="trips/[id]/add-step" options={{ title: "Add Step" }} />
            <Stack.Screen name="trips/[id]/steps/[stepId]/edit" options={{ title: "Edit Step" }} />
            <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </Gate>
      </TripProvider>
    </UserProvider>
  );
}

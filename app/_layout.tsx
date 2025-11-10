import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { TripProvider } from "../contexts/TripContext";
import { UserProvider, useUser } from "../contexts/UserContext";

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
          </Stack>
        </Gate>
      </TripProvider>
    </UserProvider>
  );
}

import { Stack, useSegments, Redirect } from "expo-router";
import React from "react";
import { TripProvider } from "@/contexts/TripContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { ActivityIndicator, View } from "react-native";

function Gate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const segments = useSegments();
  const inAuthGroup = segments[0] === "(auth)";

  // Still loading Firebase auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  // When finished loading, no user, and not already in (auth) group → redirect to login
  if (!user && !inAuthGroup) {
    return <Redirect href="/login" />;
  }

  // Otherwise, show the protected app
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <Gate>
        <TripProvider>
          <Stack screenOptions={{ headerShadowVisible: false }}>
            <Stack.Screen name="index" options={{ title: "Home" }} />
            <Stack.Screen name="onboarding" options={{ title: "Welcome" }} />
            <Stack.Screen name="profile/index" options={{ title: "Profile" }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </TripProvider>
      </Gate>
    </UserProvider>
  );
}

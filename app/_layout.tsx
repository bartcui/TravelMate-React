import { Stack, useSegments, Redirect } from "expo-router";
import React, { useEffect } from "react";
import { TripProvider } from "@/contexts/TripContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { ActivityIndicator, View } from "react-native";
import * as Notifications from "expo-notifications";
import { initTripNotificationChannel } from "@/utils/notifications";

function Gate({ children }: { children: React.ReactNode }) {
  const { user, userDoc, isLoaded } = useUser();
  const segments = useSegments();
  const inAuthGroup = segments[0] === "(auth)";
  const inProfile = segments[0] === "profile";
  const needsOnboarding =
    !!user && !!userDoc && userDoc.hasCompletedOnboarding !== true;

  // Still loading Firebase auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  console.log("segment:", segments[0]);
  console.log("needsOnboarding", needsOnboarding);
  console.log("user: ", !!user);
  console.log("inAuthGroup: ", inAuthGroup);
  // Not logged in and not in auth → go to login
  if (!user && !inAuthGroup) {
    return <Redirect href="/login" />;
  }

  // Logged in, not finished onboarding, and not already on profile → go to profile
  if (user && needsOnboarding && !inProfile) {
    return <Redirect href="/profile" />;
  }

  // Logged in, onboarding done, but still on auth pages → send to home
  if (user && !needsOnboarding && inAuthGroup) {
    return <Redirect href="/" />;
  }

  // Otherwise, show the protected app
  return <>{children}</>;
}

// Inner layout that is allowed to use useUser()
function RootLayoutInner() {
  const { user } = useUser();
  //init notifications
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldShowList: true,
        shouldSetBadge: false,
      }),
    });

    initTripNotificationChannel();
  }, []);

  return (
    <Gate>
      <TripProvider userId={user?.uid ?? null}>
        <Stack
          initialRouteName="index"
          screenOptions={{ headerShadowVisible: false }}
        >
          <Stack.Screen
            name="index"
            options={{ headerShown: false, title: "Home" }}
          />
          <Stack.Screen name="profile/index" options={{ title: "Profile" }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="trips/create"
            options={{ title: "Trips", headerShown: true }}
          />
          <Stack.Screen
            name="trips/[id]"
            options={{ headerShown: false, title: "" }}
          />
          <Stack.Screen name="notifications/index" options={{ title: "" }} />
        </Stack>
      </TripProvider>
    </Gate>
  );
}

// Top-level component that only wraps with providers
export default function RootLayout() {
  return (
    <UserProvider>
      <RootLayoutInner />
    </UserProvider>
  );
}

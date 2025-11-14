import { Stack } from "expo-router";

export default function StepsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Destination" }} />
      <Stack.Screen name="[stepId]" options={{ title: "Edit Destination" }} />
    </Stack>
  );
}

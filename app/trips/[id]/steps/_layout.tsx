import { Stack } from "expo-router";

export default function StepsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Steps" }} />
      <Stack.Screen name="[stepId]" options={{ title: "Edit Step" }} />
    </Stack>
  );
}

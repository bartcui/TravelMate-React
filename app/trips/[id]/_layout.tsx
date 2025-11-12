import { Stack } from "expo-router";

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Trip" }} />
      <Stack.Screen name="edit" options={{ title: "Edit Trip" }} />
      <Stack.Screen name="add-step" options={{ title: "Add Step" }} />
    </Stack>
  );
}

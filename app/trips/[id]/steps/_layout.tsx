import { Stack } from "expo-router";

export default function StepsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Steps" }} />
      <Stack.Screen name="[stepId]/edit" options={{ title: "Edit Step" }} />
    </Stack>
  );
}
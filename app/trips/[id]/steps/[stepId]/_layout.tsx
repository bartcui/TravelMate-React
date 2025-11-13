import { Stack } from "expo-router";

export default function StepLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="edit"
        options={{
          title: "Edit step",
        }}
      />
    </Stack>
  );
}

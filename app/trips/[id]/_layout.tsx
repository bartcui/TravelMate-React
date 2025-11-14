import { Stack } from "expo-router";
import { HeaderBackButton } from "@react-navigation/elements";
import { useNavigation } from "expo-router";

export default function TripLayout() {
  const navigation = useNavigation();
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: "Trip",
          headerShown: true,
          headerLeft: () => (
            <HeaderBackButton
              tintColor="#007AFF"
              label="Back"
              onPress={() => navigation.goBack()}
            />
          ),
        }}
      />
      <Stack.Screen
        name="edit"
        options={{ title: "", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="add-step"
        options={{ title: "", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="steps/index" options={{ title: "" }} />
      <Stack.Screen
        name="steps/[stepId]/edit"
        options={{ title: "", headerBackTitle: "Back" }}
      />
    </Stack>
  );
}

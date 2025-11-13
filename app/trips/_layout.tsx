import { Stack } from "expo-router";

export default function TripsLayout() { 
    return(
        <Stack
        screenOptions={{ headerShown: false }}>
            <Stack.Screen name="create" options={{ title: "Create Trip" }} />
            <Stack.Screen name="[id]" options={{ headerShown: false}} />
        </Stack>
    )
}
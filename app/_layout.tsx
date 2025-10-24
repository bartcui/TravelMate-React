import { Stack } from 'expo-router';
import { TripProvider } from '../contexts/TripContext';

export default function RootLayout() {
  return (
    <TripProvider>
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="trips/create" options={{ title: 'Create Trip' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      </Stack>
    </TripProvider>
  );
}

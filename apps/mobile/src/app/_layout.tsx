import { AppProviders } from '@/providers/AppProviders';
import { Stack } from 'expo-router';
import '@/i18n/setup';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppProviders>
  );
}

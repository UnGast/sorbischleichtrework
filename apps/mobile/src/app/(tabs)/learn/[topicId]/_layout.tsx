import { Stack } from 'expo-router';

export default function TopicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="assign" />
      <Stack.Screen name="write" />
    </Stack>
  );
}


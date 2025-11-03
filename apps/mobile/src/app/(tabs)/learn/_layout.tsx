import { Stack } from 'expo-router';

export default function LearnStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Vokabeln', headerShown: false }} />
      <Stack.Screen name="[topicId]" options={{ headerShown: false }} />
    </Stack>
  );
}

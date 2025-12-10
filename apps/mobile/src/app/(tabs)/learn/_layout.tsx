import { Stack } from 'expo-router';

export default function LearnStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Übungen', headerShown: false }} />
      <Stack.Screen name="[topicId]" options={{ title: 'Thema', headerShown: true }} />
    </Stack>
  );
}

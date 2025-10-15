import { Stack } from 'expo-router';

export default function PhrasesStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Phrasen', headerShown: true }} />
      <Stack.Screen name="[topicId]" options={{ title: 'Thema', headerShown: true }} />
    </Stack>
  );
}

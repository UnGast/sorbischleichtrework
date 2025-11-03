import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PhrasesStackLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={() => ({ title: t('phrases.title'), headerShown: false })} 
      />
      <Stack.Screen 
        name="[topicId]" 
        options={() => ({ title: t('topic.title'), headerShown: true })} 
      />
    </Stack>
  );
}

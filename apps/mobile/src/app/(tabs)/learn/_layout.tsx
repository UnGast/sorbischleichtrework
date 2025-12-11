import { useMemo } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function LearnStackLayout() {
  const { t } = useTranslation();
  const indexOptions = useMemo(() => ({ title: t('learn.title'), headerShown: false }), [t]);
  const topicOptions = useMemo(() => ({ title: t('topic.title'), headerShown: true }), [t]);
  
  return (
    <Stack>
      <Stack.Screen name="index" options={indexOptions} />
      <Stack.Screen name="[topicId]" options={topicOptions} />
    </Stack>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useModuleAvailability, useHundredSecondsItems } from '@/services/content/contentRepository';

export default function TabsLayout() {
  const { t } = useTranslation();
  const modules = useModuleAvailability();
  const hundredItems = useHundredSecondsItems();
  const showHundred = modules.hundredSeconds && hundredItems.length > 0;

  return (
    <Tabs
      initialRouteName="phrases"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#0F1115',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F1115',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB' },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            learn: 'book-outline',
            phrases: 'musical-notes-outline',
            'hundred/index': 'hourglass-outline',
            about: 'information-circle-outline',
          };

          const iconName = iconMap[route.name] ?? 'ellipse';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="phrases"
        options={{
          title: t('tabs.phrases'),
          href: modules.phrases ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t('tabs.learn'),
          href: modules.vocabulary ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="hundred/index"
        options={{
          title: t('tabs.hundred'),
          href: showHundred ? undefined : null,
        }}
      />
      <Tabs.Screen name="about" options={{ title: t('tabs.about') }} />
    </Tabs>
  );
}

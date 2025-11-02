import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useModuleAvailability, useHundredSecondsItems } from '@/services/content/contentRepository';

export default function TabsLayout() {
  const modules = useModuleAvailability();
  const hundredItems = useHundredSecondsItems();
  const showHundred = modules.hundredSeconds && hundredItems.length > 0;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#6E9CFD',
        headerStyle: { backgroundColor: '#0F1115' },
        headerTintColor: '#E5E7EB',
        tabBarStyle: { backgroundColor: '#0F1115' },
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
      {modules.vocabulary ? (
        <Tabs.Screen name="learn" options={{ title: 'Übungen' }} />
      ) : null}
      {modules.phrases ? (
        <Tabs.Screen name="phrases" options={{ title: 'Redwendungen' }} />
      ) : null}
      <Tabs.Screen
        name="hundred/index"
        options={{
          title: '100 Sekunden',
          href: showHundred ? undefined : null,
        }}
      />
      <Tabs.Screen name="about" options={{ title: 'Über' }} />
    </Tabs>
  );
}

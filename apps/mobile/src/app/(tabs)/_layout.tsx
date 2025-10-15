import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useModuleAvailability } from '@/services/content/contentRepository';

export default function TabsLayout() {
  const modules = useModuleAvailability();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#6E9CFD',
        headerStyle: { backgroundColor: '#0F1115' },
        headerTintColor: '#E5E7EB',
        tabBarStyle: { backgroundColor: '#0F1115' },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            learn: 'book',
            phrases: 'musical-notes',
            hundred: 'timer',
            search: 'search',
            settings: 'settings',
          };

          const iconName = iconMap[route.name] ?? 'ellipse';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {modules.vocabulary ? (
        <Tabs.Screen name="learn" options={{ title: 'Lernen' }} />
      ) : null}
      {modules.phrases ? (
        <Tabs.Screen name="phrases" options={{ title: 'Phrasen' }} />
      ) : null}
      {modules.hundredSeconds ? (
        <Tabs.Screen name="hundred" options={{ title: '100 Sekunden' }} />
      ) : null}
      <Tabs.Screen name="search" options={{ title: 'Suche' }} />
      <Tabs.Screen name="settings" options={{ title: 'Einstellungen' }} />
    </Tabs>
  );
}

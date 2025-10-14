import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { VocabularyNavigator } from '@/features/vocabulary/screens/VocabularyNavigator';
import { PhrasesNavigator } from '@/features/phrases/screens/PhrasesNavigator';
import { HundredSecondsScreen } from '@/features/hundredSeconds/screens/HundredSecondsScreen';
import { useModuleAvailability } from '@/services/content/contentRepository';
import { Screen } from '@/components/common/Screen';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

function Placeholder({ label }: { label: string }) {
  return (
    <Screen>
      <Text>{label} — coming soon.</Text>
    </Screen>
  );
}

export function RootNavigation() {
  const modules = useModuleAvailability();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Learn: 'book',
            Phrases: 'musical-notes',
            HundredSeconds: 'timer',
            Search: 'search',
            Settings: 'settings',
          };
          const iconName = iconMap[route.name] ?? 'ellipse';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {modules.vocabulary ? (
        <Tab.Screen name="Learn" component={VocabularyNavigator} />
      ) : null}
      {modules.phrases ? <Tab.Screen name="Phrases" component={PhrasesNavigator} /> : null}
      {modules.hundredSeconds ? <Tab.Screen name="HundredSeconds" component={HundredSecondsScreen} options={{ title: '100 Sekunden' }} /> : null}
      <Tab.Screen name="Search">
        {() => <Placeholder label="Search" />}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {() => <Placeholder label="Settings" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

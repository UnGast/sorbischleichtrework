import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { VocabularyNavigator } from '@/features/vocabulary/screens/VocabularyNavigator';
import { PhrasesNavigator } from '@/features/phrases/screens/PhrasesNavigator';
import { HundredSecondsScreen } from '@/features/hundredSeconds/screens/HundredSecondsScreen';
import { SearchScreen } from '@/features/search/screens/SearchScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { AboutScreen } from '@/features/about/screens/AboutScreen';

const Tab = createBottomTabNavigator();
const LearnStack = createNativeStackNavigator();

function LearnStackNavigator() {
  return (
    <LearnStack.Navigator screenOptions={{ headerShown: false }}>
      <LearnStack.Screen name="Vocabulary" component={VocabularyNavigator} />
      <LearnStack.Screen name="Phrases" component={PhrasesNavigator} />
    </LearnStack.Navigator>
  );
}

export function RootNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Learn: 'library',
            Search: 'search',
            HundredSeconds: 'time',
            Settings: 'settings',
            About: 'information-circle',
          };
          const icon = iconMap[route.name] ?? 'ellipse';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnStackNavigator} />
      <Tab.Screen name="HundredSeconds" component={HundredSecondsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
    </Tab.Navigator>
  );
}

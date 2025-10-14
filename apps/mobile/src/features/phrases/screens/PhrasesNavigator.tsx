import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhrasesTopicsScreen } from './PhrasesTopicsScreen';
import { PhraseTopicScreen } from './PhraseTopicScreen';

export type PhrasesStackParamList = {
  PhrasesTopics: undefined;
  PhraseTopic: { topicId: string };
};

const Stack = createNativeStackNavigator<PhrasesStackParamList>();

export function PhrasesNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PhrasesTopics" component={PhrasesTopicsScreen} options={{ title: 'Phrasen' }} />
      <Stack.Screen name="PhraseTopic" component={PhraseTopicScreen} options={{ title: 'Thema' }} />
    </Stack.Navigator>
  );
}

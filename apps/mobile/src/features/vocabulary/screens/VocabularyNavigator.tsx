import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VocabularyTopicScreen } from './VocabularyTopicScreen';
import { VocabularyReadScreen } from './VocabularyReadScreen';

export type VocabularyStackParamList = {
  VocabularyTopics: undefined;
  VocabularyRead: { itemId: string };
};

const Stack = createNativeStackNavigator<VocabularyStackParamList>();

export function VocabularyNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VocabularyTopics" component={VocabularyTopicScreen} options={{ title: 'Vokabeln' }} />
      <Stack.Screen name="VocabularyRead" component={VocabularyReadScreen} options={{ title: 'Lektion' }} />
    </Stack.Navigator>
  );
}

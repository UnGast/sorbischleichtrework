import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VocabularyTopicScreen } from './VocabularyTopicScreen';
import { VocabularyReadScreen } from './VocabularyReadScreen';
import { VocabularyAssignScreen } from './VocabularyAssignScreen';
import { VocabularyWriteScreen } from './VocabularyWriteScreen';

export type VocabularyStackParamList = {
  VocabularyTopics: undefined;
  VocabularyTopic: { topicId: string };
  VocabularyRead: { itemId: string };
  VocabularyAssign: { topicId: string };
  VocabularyWrite: { topicId: string };
};

const Stack = createNativeStackNavigator<VocabularyStackParamList>();

export function VocabularyNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VocabularyTopics" component={VocabularyTopicScreen} options={{ title: 'Topics' }} />
      <Stack.Screen name="VocabularyRead" component={VocabularyReadScreen} options={{ title: 'Reading' }} />
      <Stack.Screen name="VocabularyAssign" component={VocabularyAssignScreen} options={{ title: 'Matching' }} />
      <Stack.Screen name="VocabularyWrite" component={VocabularyWriteScreen} options={{ title: 'Writing' }} />
    </Stack.Navigator>
  );
}

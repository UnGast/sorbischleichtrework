import { useEffect, useMemo } from 'react';
import { FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/components/common/Screen';
import { TopicTile } from '@/components/common/TopicTile';
import { useTopicsByType } from '@/services/content/contentRepository';
import { loadMockContent } from '@/services/content/contentService';
import { PhrasesStackParamList } from './PhrasesNavigator';

import Lektion1Icon from '@/assets/images/icon.png';

type Props = NativeStackScreenProps<PhrasesStackParamList, 'PhrasesTopics'>;

const ICON_MAP = {
  'lektion1.png': Lektion1Icon,
} as const;

export function PhrasesTopicsScreen({ navigation }: Props) {
  const topics = useTopicsByType('phrases');

  useEffect(() => {
    if (topics.length === 0) {
      loadMockContent();
    }
  }, [topics.length]);

  const data = useMemo(
    () =>
      topics.map((topic) => ({
        ...topic,
        iconSource: topic.icon ? ICON_MAP[topic.icon as keyof typeof ICON_MAP] : undefined,
      })),
    [topics],
  );

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TopicTile
            name={item.nameGerman}
            subtitle={item.nameSorbian}
            icon={item.iconSource}
            onPress={() => navigation.navigate('PhraseTopic', { topicId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

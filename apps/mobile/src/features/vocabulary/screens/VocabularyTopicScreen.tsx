import { useEffect, useMemo } from 'react';
import { FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/components/common/Screen';
import { TopicTile } from '@/components/common/TopicTile';
import { VocabularyStackParamList } from './VocabularyNavigator';
import { useTopicsByType, useVocabularyMap } from '@/services/content/contentRepository';
import { loadMockContent } from '@/services/content/contentService';

import Lektion1Icon from '@/assets/images/icon.png';

type Props = NativeStackScreenProps<VocabularyStackParamList, 'VocabularyTopics'>;

type TopicViewModel = {
  id: string;
  nameGerman: string;
  nameSorbian: string;
  iconSource?: number;
  firstItemId?: string;
};

const ICON_MAP = {
  'lektion1.png': Lektion1Icon,
} as const;

export function VocabularyTopicScreen({ navigation }: Props) {
  const topics = useTopicsByType('vocabulary');
  const vocabularyMap = useVocabularyMap();

  useEffect(() => {
    if (topics.length === 0) {
      loadMockContent();
    }
  }, [topics.length]);

  const data: TopicViewModel[] = useMemo(
    () =>
      topics.map((topic) => ({
        ...topic,
        iconSource: topic.icon ? ICON_MAP[topic.icon as keyof typeof ICON_MAP] : undefined,
        firstItemId: vocabularyMap[topic.id]?.[0]?.id,
      })),
    [topics, vocabularyMap],
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
            onPress={() => {
              const fallback = 'voc-01-01';
              navigation.navigate('VocabularyRead', { itemId: item.firstItemId ?? fallback });
            }}
          />
        )}
      />
    </Screen>
  );
}

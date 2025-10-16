import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { TopicTile } from '@/components/common/TopicTile';
import { useTopicsByType, useVocabularyMap } from '@/services/content/contentRepository';
import { useAppDispatch } from '@/store';
import { setStep } from '@/services/content/vocabularySessionSlice';

import Lektion1Icon from '@assets/images/lektion1.png';

const ICON_MAP = {
  'lektion1.png': Lektion1Icon,
} as const;

export default function VocabularyTopicsRoute() {
  const topics = useTopicsByType('vocabulary');
  const vocabularyMap = useVocabularyMap();
  const router = useRouter();
  const dispatch = useAppDispatch();

  return (
    <Screen>
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const firstItemId = vocabularyMap[item.id]?.[0]?.id;
          const fallback = 'voc-01-01';

          return (
            <TopicTile
              name={item.nameGerman}
              subtitle={item.nameSorbian}
              icon={item.icon ? ICON_MAP[item.icon as keyof typeof ICON_MAP] : undefined}
              onPress={() => {
                dispatch(setStep({ topicId: item.id, step: 'read' }));
                router.push({
                  pathname: `/learn/${item.id}`,
                  params: { itemId: firstItemId ?? fallback },
                });
              }}
            />
          );
        }}
      />
    </Screen>
  );
}

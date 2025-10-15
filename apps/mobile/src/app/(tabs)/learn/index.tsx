import { FlatList } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { TopicTile } from '@/components/common/TopicTile';
import { useTopicsByType, useVocabularyMap } from '@/services/content/contentRepository';

import Lektion1Icon from '@assets/images/lektion1.png';

const ICON_MAP = {
  'lektion1.png': Lektion1Icon,
} as const;

export default function VocabularyTopicsRoute() {
  const topics = useTopicsByType('vocabulary');
  const vocabularyMap = useVocabularyMap();

  return (
    <Screen>
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const firstItemId = vocabularyMap[item.id]?.[0]?.id;
          const fallback = 'voc-01-01';
          const href = `/learn/${item.id}?itemId=${firstItemId ?? fallback}`;

          return (
            <Link href={href} asChild>
              <TopicTile
                name={item.nameGerman}
                subtitle={item.nameSorbian}
                icon={item.icon ? ICON_MAP[item.icon as keyof typeof ICON_MAP] : undefined}
              />
            </Link>
          );
        }}
      />
    </Screen>
  );
}

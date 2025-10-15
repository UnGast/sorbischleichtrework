import { useMemo } from 'react';
import { useLocalSearchParams, useGlobalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { useVocabularyForTopic } from '@/services/content/contentRepository';

import PlaceholderImage from '@assets/images/Fotolia_46575927_S.jpg';

type Params = {
  itemId?: string;
};

export default function VocabularyReadRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { itemId } = useGlobalSearchParams<Params>();
  const items = useVocabularyForTopic(topicId ?? '');

  const item = useMemo(() => {
    if (items.length === 0) {
      return undefined;
    }
    if (!itemId) {
      return items[0];
    }
    return items.find((entry) => entry.id === itemId) ?? items[0];
  }, [itemId, items]);

  if (!item) {
    return (
      <Screen>
        <Text>Keine Inhalte vorhanden.</Text>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.imageWrapper}>
        <Image source={PlaceholderImage} style={styles.image} resizeMode="cover" />
      </View>
      <Text style={styles.german}>{item.textGerman}</Text>
      <Text style={styles.sorbian}>{item.textSorbian}</Text>
      <Text style={styles.meta}>Audio: {item.audioSorbian ?? '–'}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  german: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sorbian: {
    fontSize: 20,
    color: '#4B5563',
    marginBottom: 16,
  },
  meta: {
    fontSize: 14,
    color: '#6B7280',
  },
});

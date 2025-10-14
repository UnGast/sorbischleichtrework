import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/components/common/Screen';
import { usePhrasesForTopic } from '@/services/content/contentRepository';
import { PhrasesStackParamList } from './PhrasesNavigator';

type Props = NativeStackScreenProps<PhrasesStackParamList, 'PhraseTopic'>;

export function PhraseTopicScreen({ route }: Props) {
  const { topicId } = route.params;
  const phrases = usePhrasesForTopic(topicId);

  const data = useMemo(() => phrases, [phrases]);

  if (data.length === 0) {
    return (
      <Screen>
        <Text style={styles.empty}>Für dieses Thema sind noch keine Phrasen hinterlegt.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.primary}>{item.germanText}</Text>
            <Text style={styles.secondary}>{item.sorbianText}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  primary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  secondary: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  empty: {
    fontSize: 16,
    color: '#6B7280',
  },
});

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { TopicTile } from '@/components/common/TopicTile';
import { useModuleAvailability, useTopicsByType } from '@/services/content/contentRepository';

export default function PhrasesTopicsRoute() {
  const modules = useModuleAvailability();
  const topics = useTopicsByType('phrases');

  if (!modules.phrases) {
    return (
      <Screen>
        <View style={styles.unavailableContainer}>
          <Text style={styles.unavailableTitle}>Phrasen nicht verfügbar</Text>
          <Text style={styles.unavailableText}>
            Das Phrasen-Modul ist in diesem Content-Paket nicht enthalten.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/phrases/${item.id}`} asChild>
            <TopicTile
              name={item.nameGerman}
              subtitle={item.nameSorbian}
            />
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

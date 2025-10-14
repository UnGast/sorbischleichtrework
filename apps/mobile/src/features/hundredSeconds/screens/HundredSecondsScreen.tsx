import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { AudioBar } from '@/components/common/AudioBar';
import { useHundredSecondsItems } from '@/services/content/contentRepository';
import { loadMockContent } from '@/services/content/contentService';

export function HundredSecondsScreen() {
  const items = useHundredSecondsItems();

  useEffect(() => {
    if (items.length === 0) {
      loadMockContent();
    }
  }, [items.length]);

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.heading}>Sorbisch in 100 Sekunden</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>{item.audio}</Text>
              </View>
            </View>
            <AudioBar />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  card: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});

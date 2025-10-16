import { StyleSheet, Text, View } from 'react-native';

interface Props {
  completedTopics: number;
  totalTopics: number;
  masteredExercises: number;
  totalExercises: number;
  percentComplete: number; // 0..1
}

export function VocabularyProgressSummaryCard({
  completedTopics,
  totalTopics,
  masteredExercises,
  totalExercises,
  percentComplete,
}: Props) {
  const percentLabel = Math.round(percentComplete * 100);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Dein Vokabel-Fortschritt</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{percentLabel}%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{completedTopics}</Text>
          <Text style={styles.statLabel}>Themen abgeschlossen</Text>
          <Text style={styles.statHint}>von {totalTopics}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{masteredExercises}</Text>
          <Text style={styles.statLabel}>Aufgaben gemeistert</Text>
          <Text style={styles.statHint}>von {totalExercises}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentLabel}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F1115',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  badge: {
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5F5',
  },
  statHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#1F2937',
    marginHorizontal: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#1F2937',
    borderRadius: 999,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
});



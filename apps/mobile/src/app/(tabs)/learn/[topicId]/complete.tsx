import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { useActivePackId } from '@/hooks/useActivePackId';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectTopicCompletion, setTopicCompletionStatus } from '@/store/slices/progressSlice';
import { useResolvedVocabularyForTopic } from '@/services/content/contentRepository';
import { useTopicProgressSummary } from '@/hooks/useTopicProgress';

export default function TopicCompleteRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activePackId = useActivePackId();
  const topicCompletion = useAppSelector((state) =>
    topicId ? selectTopicCompletion(state, topicId) : null,
  );
  const items = useResolvedVocabularyForTopic(topicId ?? '');

  const progressSummary = useTopicProgressSummary(topicId, items);
  const percentLabel = useMemo(
    () => Math.round(progressSummary.percentComplete * 100),
    [progressSummary.percentComplete],
  );

  if (!topicId) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>Thema nicht gefunden.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)/learn')}>
            <Text style={styles.primaryButtonText}>Zur Themenübersicht</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const hasExercises = progressSummary.totalExercises > 0;

  const handleBackHome = useCallback(() => {
    router.replace('/(tabs)/learn');
  }, [router]);

  const handleRedoTopic = useCallback(() => {
    if (!topicId) {
      return;
    }
    if (activePackId) {
      dispatch(
        setTopicCompletionStatus({
          packId: activePackId,
          topicId,
          completed: false,
        }),
      );
    }
    router.replace({ pathname: `/learn/${topicId}` });
  }, [activePackId, dispatch, router, topicId]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Gut gemacht!</Text>
        <Text style={styles.subtitle}>Du hast das Thema abgeschlossen.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dein Fortschritt</Text>
          <Text style={styles.cardValue}>
          {progressSummary.masteredExercises} / {progressSummary.totalExercises}
          </Text>
          <Text style={styles.cardHint}>
            {hasExercises ? `Beherrschte Aufgaben · ${percentLabel}%` : 'Keine Übungen in diesem Thema'}
          </Text>
          {topicCompletion?.completedAt ? (
            <Text style={styles.metaText}>
              Abgeschlossen am {new Date(topicCompletion.completedAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBackHome}>
            <Text style={styles.primaryButtonText}>Zur Themenübersicht</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRedoTopic}>
            <Text style={styles.secondaryButtonText}>Thema wiederholen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    marginTop: 32,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  cardValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 8,
  },
  cardHint: {
    fontSize: 14,
    color: '#4B5563',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
  actions: {
    width: '100%',
    marginTop: 32,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
});



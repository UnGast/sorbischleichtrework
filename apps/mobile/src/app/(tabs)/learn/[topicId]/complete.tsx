import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/common/Screen';
import { useActivePackId } from '@/hooks/useActivePackId';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectTopicCompletion, setTopicCompletionStatus } from '@/store/slices/progressSlice';
import { useResolvedVocabularyForTopic } from '@/services/content/contentRepository';
import { useTopicProgressSummary } from '@/hooks/useTopicProgress';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import { withAlpha } from '@/theme/colors';

export default function TopicCompleteRoute() {
  const { t } = useTranslation();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activePackId = useActivePackId();
  const primaryColor = usePrimaryColor();
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
          <Text style={styles.title}>{t('common.topicNotFound')}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={() => router.replace('/(tabs)/learn')}
          >
            <Text style={styles.primaryButtonText}>{t('common.toTopics')}</Text>
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
    <Screen scrollable>
      <View style={styles.container}>
        <Text style={styles.title}>{t('common.wellDone')}</Text>
        <Text style={styles.subtitle}>{t('common.topicCompleted')}</Text>

        <View style={[styles.card, { backgroundColor: withAlpha(primaryColor, 0.12) }]}>
          <Text style={[styles.cardTitle, { color: primaryColor }]}>{t('learn.topic.progress.title')}</Text>
          <Text style={styles.cardValue}>
          {progressSummary.masteredExercises} / {progressSummary.totalExercises}
          </Text>
          <Text style={styles.cardHint}>
            {hasExercises ? `${t('learn.topic.progress.mastered')} · ${percentLabel}%` : t('learn.topic.progress.noExercises')}
          </Text>
          {topicCompletion?.completedAt ? (
            <Text style={styles.metaText}>
              {t('learn.topic.completed.at')} {new Date(topicCompletion.completedAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryColor }]}
            onPress={handleBackHome}
          >
            <Text style={styles.primaryButtonText}>{t('common.toTopics')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: primaryColor }]}
            onPress={handleRedoTopic}
          >
            <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>{t('common.redoTopic')}</Text>
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
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});



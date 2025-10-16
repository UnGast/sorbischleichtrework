import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import shuffle from 'lodash/shuffle';
import { Screen } from '@/components/common/Screen';
import { useResolvedVocabularyForTopic } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAppDispatch } from '@/store';
import { setStep } from '@/services/content/vocabularySessionSlice';
import { logProgressActivity, recordProgressAttempt } from '@/store/slices/progressSlice';
import { useActivePackId } from '@/hooks/useActivePackId';

const OPTION_WIDTH = Dimensions.get('window').width - 48;

interface OptionItem {
  id: string;
  label: string;
  isCorrect: boolean;
}

export default function VocabularyAssignRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const playback = useAudioPlayback();
  const vocabItems = useResolvedVocabularyForTopic(topicId ?? '');
  const dispatch = useAppDispatch();
  const activePackId = useActivePackId();

  const prompts = useMemo(() => vocabItems.filter((item) => !item.ignoreAssign), [vocabItems]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const currentItem = prompts[currentIndex];

  const optionPool = useMemo(() => prompts.filter((item) => item.id !== currentItem?.id), [prompts, currentItem]);

  const options: OptionItem[] = useMemo(() => {
    if (!currentItem) {
      return [];
    }

    const distractors = shuffle(optionPool).slice(0, Math.min(2, optionPool.length));
    const baseOptions: OptionItem[] = [
      {
        id: currentItem.id,
        label: currentItem.textSorbian,
        isCorrect: true,
      },
      ...distractors.map((item) => ({
        id: item.id,
        label: item.textSorbian,
        isCorrect: false,
      })),
    ];

    return shuffle(baseOptions);
  }, [currentItem, optionPool]);

  const totalCount = prompts.length;
  const allDone = completed.length === totalCount && totalCount > 0;

  const handleOptionPress = useCallback(
    async (option: OptionItem) => {
      if (!currentItem) {
        return;
      }

      if (activePackId) {
        const attemptId = `${currentItem.id}#assign`;
        void dispatch(
          recordProgressAttempt({
            packId: activePackId,
            entityId: attemptId,
            entityType: 'vocab',
            correct: option.isCorrect,
          }),
        );

        void dispatch(
          logProgressActivity({
            packId: activePackId,
            id: `assign-attempt-${attemptId}-${Date.now()}`,
            ts: Date.now(),
            kind: 'complete_item',
            entityId: currentItem.id,
            entityType: 'vocab',
            metadata: { exercise: 'assign', correct: option.isCorrect },
          }),
        );
      }

      if (option.isCorrect) {
        setFeedback('correct');

        if (!completed.includes(currentItem.id)) {
          setCompleted((prev) => [...prev, currentItem.id]);
        }

        if (currentItem.audioUri) {
          await playback.playTrack({
            id: `${currentItem.id}-assign`,
            title: currentItem.textGerman,
            url: currentItem.audioUri,
            entityId: currentItem.id,
          });
        }

        setTimeout(() => {
          setFeedback(null);
          setCurrentIndex((prev) => Math.min(prev + 1, totalCount - 1));
        }, 600);
      } else {
        setFeedback('incorrect');
        setTimeout(() => setFeedback(null), 800);
      }
    },
    [activePackId, completed, currentItem, dispatch, playback, totalCount],
  );

  useEffect(() => {
    if (currentIndex >= prompts.length) {
      setCurrentIndex(Math.max(prompts.length - 1, 0));
    }
  }, [currentIndex, prompts.length]);

  const navigateToWrite = useCallback(() => {
    if (topicId) {
      dispatch(setStep({ topicId, step: 'write' }));
      if (activePackId) {
        void dispatch(
          logProgressActivity({
            packId: activePackId,
            id: `vocab-write-start-${topicId}-${Date.now()}`,
            ts: Date.now(),
            kind: 'start_writing',
            entityId: topicId,
            entityType: 'topic',
          }),
        );
      }
    }
    router.push({ pathname: `/learn/${topicId}/write` });
  }, [activePackId, dispatch, router, topicId]);

  if (prompts.length === 0) {
    return (
      <Screen>
        <Text style={styles.empty}>Keine Zuordnungsaufgaben verfügbar.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.heading}>Welche sorbische Übersetzung passt?</Text>
      <View style={styles.promptBox}>
        <Text style={styles.promptText}>{currentItem?.textGerman}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isCorrect = feedback === 'correct' && option.isCorrect;
          const isIncorrect = feedback === 'incorrect' && !option.isCorrect;
          const disabled = feedback !== null;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                isCorrect && styles.optionCorrect,
                isIncorrect && !option.isCorrect && styles.optionIncorrect,
              ]}
              onPress={() => handleOptionPress(option)}
              disabled={disabled}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.progressLabel}>
          {Math.min(currentIndex + 1, totalCount)} / {totalCount}
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, !allDone && styles.ctaButtonDisabled]}
          onPress={navigateToWrite}
          disabled={!allDone}
        >
          <Text style={styles.ctaText}>Zur Schreibübung</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  promptBox: {
    marginHorizontal: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    marginBottom: 24,
  },
  promptText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  optionsContainer: {
    alignItems: 'center',
  },
  option: {
    width: OPTION_WIDTH,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  optionText: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  optionIncorrect: {
    borderColor: '#F87171',
    backgroundColor: '#FEE2E2',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
  },
  ctaButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  ctaButtonDisabled: {
    backgroundColor: '#6EE7B7',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    fontSize: 16,
    color: '#6B7280',
  },
});


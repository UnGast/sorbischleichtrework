import { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import shuffle from 'lodash/shuffle';
import { Screen } from '@/components/common/Screen';
import { useResolvedVocabularyForTopic } from '@/services/content/contentRepository';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAppDispatch } from '@/store';
import { resetSession, setStep } from '@/services/content/vocabularySessionSlice';
import {
  logProgressActivity,
  recordProgressAttempt,
  setTopicCompletionStatus,
} from '@/store/slices/progressSlice';
import { useActivePackId } from '@/hooks/useActivePackId';

type LetterTile = {
  id: string;
  char: string;
};

function buildScrambledTiles(word: string): LetterTile[] {
  const tiles = word.split('').map((char, index) => ({
    id: `${index}-${char}-${Math.random().toString(36).slice(2, 7)}`,
    char,
  }));
  return shuffle(tiles);
}

export default function VocabularyWriteRoute() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const playback = useAudioPlayback();
  const items = useResolvedVocabularyForTopic(topicId ?? '');
  const dispatch = useAppDispatch();
  const activePackId = useActivePackId();
  const exercises = useMemo(() => items.filter((item) => !item.ignoreWrite), [items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableTiles, setAvailableTiles] = useState<LetterTile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<LetterTile[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentItem = exercises[currentIndex];
  const answer = useMemo(() => selectedTiles.map((tile) => tile.char).join(''), [selectedTiles]);

  useEffect(() => {
    if (currentItem) {
      setAvailableTiles(buildScrambledTiles(currentItem.textSorbian));
      setSelectedTiles([]);
      setIsCorrect(null);
    } else {
      setAvailableTiles([]);
      setSelectedTiles([]);
    }
  }, [currentItem]);

  useEffect(() => {
    if (!topicId || !activePackId) {
      return;
    }
    dispatch(
      logProgressActivity({
        packId: activePackId,
        id: `vocab-write-start-${topicId}-${Date.now()}`,
        ts: Date.now(),
        kind: 'start_writing',
        entityId: topicId,
        entityType: 'topic',
      }),
    );
  }, [activePackId, dispatch, topicId]);

  const handleSelectTile = useCallback(
    (tileId: string) => {
      const tile = availableTiles.find((entry) => entry.id === tileId);
      if (!tile) {
        return;
      }
      setAvailableTiles((prev) => prev.filter((entry) => entry.id !== tileId));
      setSelectedTiles((prev) => [...prev, tile]);
      setIsCorrect(null);
    },
    [availableTiles],
  );

  const handleSelectedTilePress = useCallback((tileId: string) => {
    const tile = selectedTiles.find((entry) => entry.id === tileId);
    if (!tile) {
      return;
    }
    setSelectedTiles((prev) => prev.filter((entry) => entry.id !== tileId));
    setAvailableTiles((prev) => shuffle([...prev, tile]));
    setIsCorrect(null);
  }, [selectedTiles]);

  const handleUndo = useCallback(() => {
    setSelectedTiles((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const next = [...prev];
      const tile = next.pop();
      if (tile) {
        setAvailableTiles((avail) => shuffle([...avail, tile]));
      }
      return next;
    });
    setIsCorrect(null);
  }, []);

  const checkAnswer = useCallback(async () => {
    if (!currentItem) return;
    if (answer.length === 0) {
      setIsCorrect(false);
      return;
    }
    const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
    const normalized = normalize(answer);
    const expected = normalize(currentItem.textSorbian);
    const correct = normalized === expected;
    setIsCorrect(correct);

    if (activePackId) {
      const attemptId = `${currentItem.id}#write`;
      void dispatch(
        recordProgressAttempt({
          packId: activePackId,
          entityId: attemptId,
          entityType: 'vocab',
          correct,
        }),
      );

      void dispatch(
        logProgressActivity({
          packId: activePackId,
          id: `write-attempt-${attemptId}-${Date.now()}`,
          ts: Date.now(),
          kind: 'complete_item',
          entityId: currentItem.id,
          entityType: 'vocab',
          metadata: { exercise: 'write', correct },
        }),
      );
    }

    if (correct && currentItem.audioUri) {
      await playback.playTrack({
        id: `${currentItem.id}-write`,
        title: currentItem.textGerman,
        url: currentItem.audioUri,
        entityId: currentItem.id,
      });
    }
  }, [answer, currentItem, playback]);

  const goNext = useCallback(async () => {
    if (currentIndex === exercises.length - 1) {
      if (topicId) {
        dispatch(setStep({ topicId, step: 'complete' }));
        dispatch(resetSession(topicId));
        if (activePackId) {
          void dispatch(
            setTopicCompletionStatus({
              packId: activePackId,
              topicId,
              completed: true,
            }),
          );

          void dispatch(
            logProgressActivity({
              packId: activePackId,
              id: `vocab-topic-complete-${topicId}-${Date.now()}`,
              ts: Date.now(),
              kind: 'finish_topic',
              entityId: topicId,
              entityType: 'topic',
            }),
          );
        }
      }
      router.replace({ pathname: `/learn/${topicId}/complete` });
      return;
    }
    setIsCorrect(null);
    setCurrentIndex((prev) => Math.min(prev + 1, exercises.length - 1));
  }, [activePackId, currentIndex, dispatch, exercises.length, router, topicId]);

  if (!currentItem) {
    return (
      <Screen>
        <Text style={styles.empty}>Keine Schreibaufgaben verfügbar.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.prompt}>Schreibe das sorbische Wort für</Text>
          <Text style={styles.german}>{currentItem.textGerman}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Deine Antwort</Text>
            <View
              style={[
                styles.answerBox,
                isCorrect === true && styles.answerCorrect,
                isCorrect === false && styles.answerIncorrect,
              ]}
            >
              <Text style={[styles.answerPreview, selectedTiles.length === 0 && styles.answerPlaceholder]}>
                {selectedTiles.length === 0 ? 'Tippe die Buchstaben an' : answer}
              </Text>

              {selectedTiles.length > 0 ? (
                <View style={styles.answerLetters}>
                  {selectedTiles.map((tile, index) => (
                    <TouchableOpacity
                      key={tile.id}
                      style={styles.selectedTile}
                      onPress={() => handleSelectedTilePress(tile.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ausgewählter Buchstabe ${tile.char}`}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.selectedTileText}>{tile.char}</Text>
                      <Text style={styles.selectedTileIndex}>{index + 1}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.answerActions}>
              <TouchableOpacity
                style={[styles.actionChip, selectedTiles.length === 0 && styles.actionChipDisabled]}
                onPress={handleUndo}
                disabled={selectedTiles.length === 0}
              >
                <Text
                  style={[styles.actionChipText, selectedTiles.length === 0 && styles.actionChipTextDisabled]}
                >
                  Löschen
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => {
                  if (!currentItem) {
                    return;
                  }
                  setAvailableTiles(buildScrambledTiles(currentItem.textSorbian));
                  setSelectedTiles([]);
                  setIsCorrect(null);
                }}
              >
                <Text style={styles.actionChipText}>Neu mischen</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Verfügbare Buchstaben</Text>
            <View style={styles.lettersContainer}>
              {availableTiles.length === 0 ? (
                <Text style={styles.answerPlaceholder}>Alle Buchstaben verwendet</Text>
              ) : (
                availableTiles.map((tile) => (
                  <TouchableOpacity
                    key={tile.id}
                    style={styles.letterTile}
                    onPress={() => handleSelectTile(tile.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Buchstabe ${tile.char}`}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.letterText}>{tile.char}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {isCorrect === false ? <Text style={styles.feedbackError}>Fast! Versuche es erneut.</Text> : null}
          {isCorrect === true ? (
            <Text style={styles.feedbackSuccess}>{`Richtig! ${currentItem.textSorbian}`}</Text>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity onPress={checkAnswer} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Prüfen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>
                {currentIndex === exercises.length - 1 ? 'Fertigstellen' : 'Weiter'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  prompt: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
  },
  german: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
    marginVertical: 16,
  },
  scrambleBox: {
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 16,
    marginVertical: 16,
  },
  scrambleText: {
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#111827',
  },
  inputError: {
    borderColor: '#F87171',
  },
  inputSuccess: {
    borderColor: '#10B981',
  },
  feedbackError: {
    marginTop: 12,
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  feedbackSuccess: {
    marginTop: 12,
    color: '#059669',
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  secondaryText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  answerBox: {
    borderWidth: 2,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  answerCorrect: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  answerIncorrect: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  answerPreview: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    minHeight: 36,
  },
  answerPlaceholder: {
    color: '#9CA3AF',
  },
  answerLetters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  answerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    justifyContent: 'center',
  },
  actionChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#E0E7FF',
  },
  actionChipDisabled: {
    backgroundColor: '#F3F4F6',
  },
  actionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  actionChipTextDisabled: {
    color: '#9CA3AF',
  },
  selectedTile: {
    minWidth: 60,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTileText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedTileIndex: {
    fontSize: 10,
    color: '#DBEAFE',
    marginTop: 2,
  },
  lettersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 12,
  },
  letterTile: {
    minWidth: 70,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  letterText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});


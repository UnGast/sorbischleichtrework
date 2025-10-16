import { useMemo } from 'react';

import { useAppSelector } from '@/store';
import type { ResolvedVocabItem } from '@/services/content/contentRepository';

const ACCURACY_THRESHOLD = 0.8;

export interface ExerciseProgressSummary {
  total: number;
  attempted: number;
  mastered: number;
}

export interface TopicProgressSummary {
  assign: ExerciseProgressSummary;
  write: ExerciseProgressSummary;
  totalExercises: number;
  masteredExercises: number;
  percentComplete: number; // 0..1
}

const EMPTY_SUMMARY: TopicProgressSummary = {
  assign: { total: 0, attempted: 0, mastered: 0 },
  write: { total: 0, attempted: 0, mastered: 0 },
  totalExercises: 0,
  masteredExercises: 0,
  percentComplete: 0,
};

export function useTopicProgressSummary(topicId: string | undefined, items: ResolvedVocabItem[]): TopicProgressSummary {
  const records = useAppSelector((state) => state.progress.records);

  const summary = useMemo(() => {
    if (!topicId || items.length === 0) {
      return EMPTY_SUMMARY;
    }

    let assignTotal = 0;
    let assignAttempted = 0;
    let assignMastered = 0;

    let writeTotal = 0;
    let writeAttempted = 0;
    let writeMastered = 0;

    items.forEach((item) => {
      if (!item.ignoreAssign) {
        assignTotal += 1;
        const record = records[`vocab:${item.id}#assign`];
        if (record && record.attempts > 0) {
          assignAttempted += 1;
          if (record.correct / record.attempts >= ACCURACY_THRESHOLD) {
            assignMastered += 1;
          }
        }
      }

      if (!item.ignoreWrite) {
        writeTotal += 1;
        const record = records[`vocab:${item.id}#write`];
        if (record && record.attempts > 0) {
          writeAttempted += 1;
          if (record.correct / record.attempts >= ACCURACY_THRESHOLD) {
            writeMastered += 1;
          }
        }
      }
    });

    const totalExercises = assignTotal + writeTotal;
    const masteredExercises = assignMastered + writeMastered;
    const percentComplete = totalExercises === 0 ? 0 : masteredExercises / totalExercises;

    return {
      assign: { total: assignTotal, attempted: assignAttempted, mastered: assignMastered },
      write: { total: writeTotal, attempted: writeAttempted, mastered: writeMastered },
      totalExercises,
      masteredExercises,
      percentComplete,
    };
  }, [items, records, topicId]);

  return summary;
}



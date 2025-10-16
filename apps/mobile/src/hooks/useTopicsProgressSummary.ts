import { useMemo } from 'react';

import { useAppSelector } from '@/store';
import type { Topic, VocabItem } from '@/types/content';

const ACCURACY_THRESHOLD = 0.8;

export interface TopicProgress {
  topicId: string;
  totalExercises: number;
  masteredExercises: number;
  percentComplete: number;
  isCompleted: boolean;
}

export interface VocabularyProgressSummary {
  totalTopics: number;
  completedTopics: number;
  totalExercises: number;
  masteredExercises: number;
  percentComplete: number;
  byTopic: Record<string, TopicProgress>;
}

export function useVocabularyProgressSummary(
  topics: Topic[],
  vocabularyByTopic: Record<string, VocabItem[]>,
): VocabularyProgressSummary {
  const records = useAppSelector((state) => state.progress.records);

  return useMemo(() => {
    if (topics.length === 0) {
      return {
        totalTopics: 0,
        completedTopics: 0,
        totalExercises: 0,
        masteredExercises: 0,
        percentComplete: 0,
        byTopic: {},
      };
    }

    let totalExercises = 0;
    let masteredExercises = 0;
    let completedTopics = 0;
    const byTopic: Record<string, TopicProgress> = {};

    topics.forEach((topic) => {
      const items = vocabularyByTopic[topic.id] ?? [];
      let topicTotal = 0;
      let topicMastered = 0;

      items.forEach((item) => {
        if (!item.ignoreAssign) {
          topicTotal += 1;
          const record = records[`vocab:${item.id}#assign`];
          if (record && record.attempts > 0 && record.correct / record.attempts >= ACCURACY_THRESHOLD) {
            topicMastered += 1;
          }
        }

        if (!item.ignoreWrite) {
          topicTotal += 1;
          const record = records[`vocab:${item.id}#write`];
          if (record && record.attempts > 0 && record.correct / record.attempts >= ACCURACY_THRESHOLD) {
            topicMastered += 1;
          }
        }
      });

      const percentComplete = topicTotal === 0 ? 0 : topicMastered / topicTotal;
      const isCompleted = topicTotal > 0 && topicMastered === topicTotal;

      totalExercises += topicTotal;
      masteredExercises += topicMastered;
      if (isCompleted) {
        completedTopics += 1;
      }

      byTopic[topic.id] = {
        topicId: topic.id,
        totalExercises: topicTotal,
        masteredExercises: topicMastered,
        percentComplete,
        isCompleted,
      };
    });

    const percentComplete = totalExercises === 0 ? 0 : masteredExercises / totalExercises;

    return {
      totalTopics: topics.length,
      completedTopics,
      totalExercises,
      masteredExercises,
      percentComplete,
      byTopic,
    };
  }, [records, topics, vocabularyByTopic]);
}



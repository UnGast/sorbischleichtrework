import { useAppSelector } from '@/store';
import { Topic } from '@/types/content';

export function useContentSlice() {
  return useAppSelector((state) => state.content);
}

export function useTopicsByType(type: 'vocabulary' | 'phrases' | 'hundredSeconds') {
  return useAppSelector((state) => {
    const { topicOrder, topicsById } = state.content;
    const filtered = topicOrder
      .map((id) => topicsById[id])
      .filter((topic): topic is Topic => !!topic && topic.type === type);
    return filtered.length > 0 ? filtered : [];
  });
}

export function useTopicById(topicId: string) {
  return useAppSelector((state) => state.content.topicsById[topicId]);
}

export function useVocabularyMap() {
  return useAppSelector((state) => state.content.vocabularyByTopic);
}

export function usePhrasesMap() {
  return useAppSelector((state) => state.content.phrasesByTopic);
}

export function useVocabularyForTopic(topicId: string) {
  return useAppSelector((state) => state.content.vocabularyByTopic[topicId] ?? []);
}

export function usePhrasesForTopic(topicId: string) {
  return useAppSelector((state) => state.content.phrasesByTopic[topicId] ?? []);
}

export function useHundredSecondsItems() {
  return useAppSelector((state) => state.content.hundredSeconds);
}

export function useModuleAvailability() {
  return useAppSelector((state) => state.content.modules);
}

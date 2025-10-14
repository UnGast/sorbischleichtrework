import { useAppSelector } from '@/hooks/useAppSelector';

export function useTopicsByType(type: 'vocabulary' | 'phrases' | 'hundredSeconds') {
  return useAppSelector((state) => state.content.topics.filter((topic) => topic.type === type));
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

export function useModuleAvailability() {
  return useAppSelector((state) => state.content.modules);
}

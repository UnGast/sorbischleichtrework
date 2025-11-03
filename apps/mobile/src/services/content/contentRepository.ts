import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import { Topic, VocabItem, HundredSecItem } from '@/types/content';
import { packManager } from './packManager';

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

export interface ResolvedVocabItem extends VocabItem {
  audioUri?: string;
  imageUri?: string;
}

export function useResolvedVocabularyForTopic(topicId: string): ResolvedVocabItem[] {
  const items = useAppSelector((state) => state.content.vocabularyByTopic[topicId] ?? []);

  return useMemo(() => {
    return items.map((item) => {
      const audioUri = item.audioSorbian ? packManager.resolveAssetUri(item.audioSorbian) ?? item.audioSorbian : undefined;
      const imageUri = item.img ? packManager.resolveAssetUri(item.img) ?? item.img : undefined;

      return {
        ...item,
        audioUri,
        imageUri,
      };
    });
  }, [items]);
}

export interface ResolvedHundredSecItem extends HundredSecItem {
  audioUri?: string;
  imageUri?: string;
}

export function useHundredSecondsItems(): ResolvedHundredSecItem[] {
  const items = useAppSelector((state) => state.content.hundredSeconds);

  return useMemo(() => {
    return items.map((item) => {
      const audioUri = item.audio ? packManager.resolveAssetUri(item.audio) ?? item.audio : undefined;
      const imageUri = item.image ? packManager.resolveAssetUri(item.image) ?? item.image : undefined;

      return {
        ...item,
        audioUri,
        imageUri,
      };
    });
  }, [items]);
}

export function useModuleAvailability() {
  return useAppSelector((state) => state.content.modules);
}

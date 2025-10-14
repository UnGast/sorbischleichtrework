import { store } from '@/store';
import { setModuleAvailability, setPhrases, setTopics, setVocabulary } from '@/store/slices/contentSlice';
import { mockTopics, mockVocabulary, mockPhrases } from './mockData';

export function loadMockContent() {
  store.dispatch(setTopics(mockTopics));
  Object.entries(mockVocabulary).forEach(([topicId, items]) => {
    store.dispatch(setVocabulary({ topicId, items }));
  });
  Object.entries(mockPhrases).forEach(([topicId, items]) => {
    store.dispatch(setPhrases({ topicId, items }));
  });
  store.dispatch(
    setModuleAvailability({
      vocabulary: true,
      phrases: true,
      hundredSeconds: false,
    }),
  );
}

import { store } from '@/store';
import { setHundredSeconds, setModuleAvailability, setPhrases, setTopics, setVocabulary } from '@/store/slices/contentSlice';
import { mockTopics, mockVocabulary, mockPhrases, mockHundredSeconds } from './mockData';

export function loadMockContent() {
  store.dispatch(setTopics(mockTopics));
  Object.entries(mockVocabulary).forEach(([topicId, items]) => {
    store.dispatch(setVocabulary({ topicId, items }));
  });
  Object.entries(mockPhrases).forEach(([topicId, items]) => {
    store.dispatch(setPhrases({ topicId, items }));
  });
  store.dispatch(setHundredSeconds(mockHundredSeconds));
  store.dispatch(
    setModuleAvailability({
      vocabulary: true,
      phrases: true,
      hundredSeconds: true,
    }),
  );
}

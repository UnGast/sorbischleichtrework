import { store } from '@/store';
import {
  setHundredSeconds,
  setModuleAvailability,
  setPhrases,
  setTopics,
  setVocabulary,
  setContentLoading,
} from '@/store/slices/contentSlice';
import { setBootstrapStatus, setAppError, setActivePack } from '@/store/slices/appSlice';
import { mockHundredSeconds, mockPhrases, mockTopics, mockVocabulary } from './mockData';
import { packManager } from './packManager';

export async function initializeContent() {
  const { dispatch } = store;

  dispatch(setBootstrapStatus('initializing'));
  dispatch(setContentLoading(true));

  try {
    await packManager.init();

    const availablePacks = await packManager.listAvailablePacks();

    if (availablePacks.length === 0) {
      throw new Error('No content packs available');
    }

    const activePack = availablePacks[0];
    dispatch(setActivePack(activePack.packId));
    await packManager.activatePack(activePack.packId);

    const packData = await packManager.loadPackContent(activePack.packId);

    if (!packData) {
      throw new Error('Failed to load pack content');
    }

    const { content, modules } = packData;
    const { topics, vocabularyByTopic, phrasesByTopic, hundredSeconds } = content;

    dispatch(setTopics(topics));

    Object.entries(vocabularyByTopic).forEach(([topicId, items]) => {
      dispatch(setVocabulary({ topicId, items }));
    });

    Object.entries(phrasesByTopic).forEach(([topicId, items]) => {
      dispatch(setPhrases({ topicId, items }));
    });

    dispatch(setHundredSeconds(hundredSeconds));
    dispatch(setModuleAvailability(modules));

    dispatch(setBootstrapStatus('ready'));
  } catch (error) {
    console.error('Failed to initialize content', error);
    dispatch(setAppError(error instanceof Error ? error.message : 'Unknown error'));
    await loadMockContent();
  } finally {
    dispatch(setContentLoading(false));
  }
}

export async function loadMockContent() {
  const { dispatch } = store;

  dispatch(setTopics(mockTopics));
  dispatch(setActivePack('mock-pack'));
  Object.entries(mockVocabulary).forEach(([topicId, items]) => {
    dispatch(setVocabulary({ topicId, items }));
  });
  Object.entries(mockPhrases).forEach(([topicId, items]) => {
    dispatch(setPhrases({ topicId, items }));
  });
  dispatch(setHundredSeconds(mockHundredSeconds));
  dispatch(
    setModuleAvailability({
      vocabulary: true,
      phrases: true,
      hundredSeconds: true,
    }),
  );
  dispatch(setBootstrapStatus('ready'));
}

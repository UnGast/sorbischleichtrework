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
import { packManager } from './packManager';
import { progressDatabase } from '@/services/db/progressDatabase';
import { loadProgressForPack } from '@/store/slices/progressSlice';
import { ensureLegacyPackAvailable } from '@/services/content/devPackBuilder';

export async function initializeContent() {
  const { dispatch } = store;

  dispatch(setBootstrapStatus('initializing'));
  dispatch(setContentLoading(true));

  try {
    await Promise.all([packManager.init(), progressDatabase.init()]);

    let availablePacks = await packManager.listAvailablePacks();

    if (availablePacks.length === 0) {
      await ensureLegacyPackAvailable();
      await packManager.init();
      availablePacks = await packManager.listAvailablePacks();
    }

    if (availablePacks.length === 0) {
      throw new Error('No content packs available');
    }

    const activePack = availablePacks[0];
    dispatch(setActivePack(activePack.packId));
    await packManager.activatePack(activePack.packId);
    await store.dispatch(loadProgressForPack(activePack.packId));

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
    await loadLegacyContent();
  } finally {
    dispatch(setContentLoading(false));
  }
}

export async function loadLegacyContent() {
  const { dispatch } = store;

  await progressDatabase.init();
  await ensureLegacyPackAvailable();
  await packManager.init();

  const fallbackPackId = 'legacy-pack';
  dispatch(setActivePack(fallbackPackId));
  await store.dispatch(loadProgressForPack(fallbackPackId));

  const packData = await packManager.loadPackContent(fallbackPackId);
  if (!packData) {
    throw new Error('Fallback legacy pack not found');
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
}

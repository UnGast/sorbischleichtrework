import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Topic, VocabItem, PhraseItem, HundredSecItem, ModuleAvailability } from '@/types/content';

export interface ContentState {
  topicsById: Record<string, Topic>;
  topicOrder: string[];
  vocabularyByTopic: Record<string, VocabItem[]>;
  phrasesByTopic: Record<string, PhraseItem[]>;
  hundredSeconds: HundredSecItem[];
  modules: ModuleAvailability;
  isLoading: boolean;
}

const initialState: ContentState = {
  topicsById: {},
  topicOrder: [],
  vocabularyByTopic: {},
  phrasesByTopic: {},
  hundredSeconds: [],
  modules: {
    vocabulary: false,
    phrases: false,
    hundredSeconds: false,
  },
  isLoading: false,
};

function sortTopics(topics: Topic[]) {
  return [...topics].sort((a, b) => a.order - b.order);
}

function sortHundredSeconds(items: HundredSecItem[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setContentLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setTopics(state, action: PayloadAction<Topic[]>) {
      state.topicsById = {};
      const sorted = sortTopics(action.payload);
      state.topicOrder = sorted.map((topic) => {
        state.topicsById[topic.id] = topic;
        return topic.id;
      });
    },
    upsertTopic(state, action: PayloadAction<Topic>) {
      const topic = action.payload;
      state.topicsById[topic.id] = topic;
      if (!state.topicOrder.includes(topic.id)) {
        state.topicOrder.push(topic.id);
      }
      state.topicOrder = sortTopics(
        state.topicOrder.map((id) => state.topicsById[id]).filter(Boolean) as Topic[],
      ).map((t) => t.id);
    },
    setVocabulary(state, action: PayloadAction<{ topicId: string; items: VocabItem[] }>) {
      const { topicId, items } = action.payload;
      state.vocabularyByTopic[topicId] = items;
    },
    setPhrases(state, action: PayloadAction<{ topicId: string; items: PhraseItem[] }>) {
      const { topicId, items } = action.payload;
      state.phrasesByTopic[topicId] = items;
    },
    setHundredSeconds(state, action: PayloadAction<HundredSecItem[]>) {
      state.hundredSeconds = sortHundredSeconds(action.payload);
    },
    setModuleAvailability(state, action: PayloadAction<Partial<ModuleAvailability>>) {
      state.modules = { ...state.modules, ...action.payload };
    },
    resetContent: () => initialState,
  },
});

export const {
  setContentLoading,
  setTopics,
  upsertTopic,
  setVocabulary,
  setPhrases,
  setHundredSeconds,
  setModuleAvailability,
  resetContent,
} = contentSlice.actions;

export default contentSlice.reducer;

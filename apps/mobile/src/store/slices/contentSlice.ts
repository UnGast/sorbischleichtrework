import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContentTopic, VocabularyItem, PhraseItem } from '@/types/content';

type ContentModuleAvailability = {
  vocabulary: boolean;
  phrases: boolean;
  hundredSeconds: boolean;
};

interface ContentState {
  topics: ContentTopic[];
  vocabularyByTopic: Record<string, VocabularyItem[]>;
  phrasesByTopic: Record<string, PhraseItem[]>;
  modules: ContentModuleAvailability;
}

const initialState: ContentState = {
  topics: [],
  vocabularyByTopic: {},
  phrasesByTopic: {},
  modules: {
    vocabulary: false,
    phrases: false,
    hundredSeconds: false,
  },
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setTopics(state, action: PayloadAction<ContentTopic[]>) {
      state.topics = action.payload;
    },
    setVocabulary(state, action: PayloadAction<{ topicId: string; items: VocabularyItem[] }>) {
      const { topicId, items } = action.payload;
      state.vocabularyByTopic[topicId] = items;
    },
    setPhrases(state, action: PayloadAction<{ topicId: string; items: PhraseItem[] }>) {
      const { topicId, items } = action.payload;
      state.phrasesByTopic[topicId] = items;
    },
    setModuleAvailability(state, action: PayloadAction<Partial<ContentModuleAvailability>>) {
      state.modules = { ...state.modules, ...action.payload };
    },
    resetContent(state) {
      state.topics = [];
      state.vocabularyByTopic = {};
      state.phrasesByTopic = {};
      state.modules = initialState.modules;
    },
  },
});

export const { setTopics, setVocabulary, setPhrases, setModuleAvailability, resetContent } = contentSlice.actions;
export default contentSlice.reducer;

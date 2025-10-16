import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type VocabularyStep = 'read' | 'assign' | 'write' | 'complete';

interface VocabularySessionState {
  byTopic: Record<string, VocabularyStep>;
  positions: Record<string, number>;
}

const initialState: VocabularySessionState = {
  byTopic: {},
  positions: {},
};

const vocabularySessionSlice = createSlice({
  name: 'vocabularySession',
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<{ topicId: string; step: VocabularyStep }>) {
      state.byTopic[action.payload.topicId] = action.payload.step;
    },
    setPosition(state, action: PayloadAction<{ topicId: string; index: number }>) {
      state.positions[action.payload.topicId] = action.payload.index;
    },
    resetSession(state, action: PayloadAction<string | undefined>) {
      if (action.payload) {
        delete state.byTopic[action.payload];
        delete state.positions[action.payload];
      } else {
        state.byTopic = {};
        state.positions = {};
      }
    },
  },
});

export const { setStep, setPosition, resetSession } = vocabularySessionSlice.actions;
export default vocabularySessionSlice.reducer;


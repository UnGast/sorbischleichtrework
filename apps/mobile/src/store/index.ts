import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import appReducer from '@/store/slices/appSlice';
import settingsReducer from '@/store/slices/settingsSlice';
import contentReducer from '@/store/slices/contentSlice';
import progressReducer from '@/store/slices/progressSlice';
import audioReducer from '@/store/slices/audioSlice';
import vocabularySessionReducer from '@/services/content/vocabularySessionSlice';

export const rootReducer = combineReducers({
  app: appReducer,
  settings: settingsReducer,
  content: contentReducer,
  progress: progressReducer,
  audio: audioReducer,
  vocabularySession: vocabularySessionReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


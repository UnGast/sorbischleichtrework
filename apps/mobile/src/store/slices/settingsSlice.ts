import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ThemePreference = 'system' | 'light' | 'dark';

type DownloadPolicy = 'wifi' | 'always' | 'manual';

interface SettingsState {
  theme: ThemePreference;
  phrasePrimaryLanguage: 'de' | 'sb';
  downloadPolicy: DownloadPolicy;
}

const initialState: SettingsState = {
  theme: 'system',
  phrasePrimaryLanguage: 'sb',
  downloadPolicy: 'wifi',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    setPhrasePrimaryLanguage(state, action: PayloadAction<'de' | 'sb'>) {
      state.phrasePrimaryLanguage = action.payload;
    },
    setDownloadPolicy(state, action: PayloadAction<DownloadPolicy>) {
      state.downloadPolicy = action.payload;
    },
  },
});

export const { setTheme, setPhrasePrimaryLanguage, setDownloadPolicy } = settingsSlice.actions;
export default settingsSlice.reducer;

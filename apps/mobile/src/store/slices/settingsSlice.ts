import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemePreference = 'system' | 'light' | 'dark';
export type DownloadPolicy = 'wifi' | 'always' | 'manual';
export type PrimaryLanguage = 'de' | 'sb';

export interface SettingsState {
  theme: ThemePreference;
  downloadPolicy: DownloadPolicy;
  phrasesPrimaryLanguage: PrimaryLanguage;
  enableAnalytics: boolean;
  enableNotifications: boolean;
}

const initialState: SettingsState = {
  theme: 'system',
  downloadPolicy: 'wifi',
  phrasesPrimaryLanguage: 'sb',
  enableAnalytics: false,
  enableNotifications: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    setDownloadPolicy(state, action: PayloadAction<DownloadPolicy>) {
      state.downloadPolicy = action.payload;
    },
    setPhrasesPrimaryLanguage(state, action: PayloadAction<PrimaryLanguage>) {
      state.phrasesPrimaryLanguage = action.payload;
    },
    setAnalyticsEnabled(state, action: PayloadAction<boolean>) {
      state.enableAnalytics = action.payload;
    },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.enableNotifications = action.payload;
    },
    resetSettings: () => initialState,
  },
});

export const { setTheme, setDownloadPolicy, setPhrasesPrimaryLanguage, setAnalyticsEnabled, setNotificationsEnabled, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;

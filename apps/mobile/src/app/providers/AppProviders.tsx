import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { loadMockContent } from '@/services/content/contentService';
import { RootNavigation } from '../navigation/RootNavigation';

function AppRoot() {
  useEffect(() => {
    loadMockContent();
  }, []);

  return <RootNavigation />;
}

export function AppProviders() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <NavigationContainer>
            <AppRoot />
          </NavigationContainer>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

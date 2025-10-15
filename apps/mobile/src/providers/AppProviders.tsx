import { PropsWithChildren, useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { store, useAppSelector } from '@/store';
import { initializeContent } from '@/services/content/contentService';

function BootstrapGate({ children }: PropsWithChildren) {
  const didInitRef = useRef(false);
  const bootstrapStatus = useAppSelector((state) => state.app.bootstrapStatus);
  const errorMessage = useAppSelector((state) => state.app.errorMessage);

  useEffect(() => {
    if (!didInitRef.current) {
      initializeContent();
      didInitRef.current = true;
    }
  }, []);

  if (bootstrapStatus === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Fehler beim Laden der Inhalte</Text>
        <Text style={styles.errorMessage}>{errorMessage ?? 'Unbekannter Fehler'}</Text>
      </View>
    );
  }

  if (bootstrapStatus !== 'ready') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6E9CFD" />
      </View>
    );
  }

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <Provider store={store}>
          <BootstrapGate>{children}</BootstrapGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

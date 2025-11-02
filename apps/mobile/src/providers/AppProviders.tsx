import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { store, useAppSelector } from '@/store';
import { initializeContent } from '@/services/content/contentService';
import { StartScreen } from '@/components/common/StartScreen';

const MIN_SPLASH_DURATION_MS = 1000;

function BootstrapGate({ children }: PropsWithChildren) {
  const didInitRef = useRef(false);
  const splashStartRef = useRef<number>(Date.now());
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSplashLocked, setIsSplashLocked] = useState(true);
  const bootstrapStatus = useAppSelector((state) => state.app.bootstrapStatus);
  const errorMessage = useAppSelector((state) => state.app.errorMessage);

  useEffect(() => {
    if (!didInitRef.current) {
      splashStartRef.current = Date.now();
      initializeContent();
      didInitRef.current = true;
      setIsSplashLocked(true);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (bootstrapStatus === 'idle' || bootstrapStatus === 'initializing') {
      splashStartRef.current = Date.now();
      setIsSplashLocked(true);
      return;
    }

    if (bootstrapStatus === 'error') {
      setIsSplashLocked(false);
      return;
    }

    if (bootstrapStatus === 'ready') {
      const elapsed = Date.now() - splashStartRef.current;
      const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);

      if (remaining === 0) {
        setIsSplashLocked(false);
      } else {
        hideTimeoutRef.current = setTimeout(() => {
          setIsSplashLocked(false);
          hideTimeoutRef.current = null;
        }, remaining);
      }
    }
  }, [bootstrapStatus]);

  if (bootstrapStatus === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Fehler beim Laden der Inhalte</Text>
        <Text style={styles.errorMessage}>{errorMessage ?? 'Unbekannter Fehler'}</Text>
      </View>
    );
  }

  const showSplash = bootstrapStatus !== 'ready' || isSplashLocked;

  if (showSplash) {
    const message = bootstrapStatus === 'ready' ? "Los geht's!" : 'Inhalte werden geladen...';
    return <StartScreen message={message} showSpinner={bootstrapStatus !== 'ready'} />;
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

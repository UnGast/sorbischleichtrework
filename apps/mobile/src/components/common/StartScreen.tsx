import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';

interface StartScreenProps {
  message?: string;
  showSpinner?: boolean;
}

const WITAJ_LOGO = require('@assets/images/splash-icon.png');

export function StartScreen({ message = 'Inhalte werden geladen...', showSpinner = true }: StartScreenProps) {
  const primaryColor = usePrimaryColor();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={WITAJ_LOGO} style={styles.logo} resizeMode="contain" />

        {showSpinner ? <ActivityIndicator size="large" color={primaryColor} style={styles.spinner} /> : null}

        <Text style={[styles.message, { color: primaryColor }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    width: 280,
    height: 100,
  },
  spinner: {
    marginTop: 8,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

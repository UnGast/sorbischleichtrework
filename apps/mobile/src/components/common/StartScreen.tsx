import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';

interface StartScreenProps {
  message?: string;
  showSpinner?: boolean;
}

const WITAJ_LOGO = require('@assets/images/splash-icon.png');

export function StartScreen({ message, showSpinner = true }: StartScreenProps) {
  const { t } = useTranslation();
  const primaryColor = usePrimaryColor();
  const displayMessage = message ?? t('app.loading.content');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={WITAJ_LOGO} style={styles.logo} resizeMode="contain" />

        {showSpinner ? <ActivityIndicator size="large" color={primaryColor} style={styles.spinner} /> : null}

        <Text style={[styles.message, { color: primaryColor }]}>{displayMessage}</Text>
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

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import { withAlpha } from '@/theme/colors';

interface StartScreenProps {
  message?: string;
  showSpinner?: boolean;
}

export function StartScreen({ message = 'Inhalte werden geladen...', showSpinner = true }: StartScreenProps) {
  const primaryColor = usePrimaryColor();

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.content}>
        <View style={styles.logoPlaceholder} />

        {showSpinner ? <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} /> : null}

        <Text style={styles.message}>{message}</Text>
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
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: withAlpha('#FFFFFF', 0.35),
    backgroundColor: withAlpha('#FFFFFF', 0.08),
  },
  spinner: {
    marginTop: 8,
  },
  message: {
    color: withAlpha('#FFFFFF', 0.9),
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});


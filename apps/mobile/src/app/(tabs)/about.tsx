import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/common/Screen';

const LEGAL_ENTRY_KEYS = [
  'about.legal.publisher',
  'about.legal.address',
  'about.legal.phrases',
  'about.legal.editedBy',
  'about.legal.hundredSeconds',
  'about.legal.vocabulary',
  'about.legal.development',
  'about.legal.proofreading',
  'about.legal.speakers',
  'about.legal.audio',
  'about.legal.editing',
  'about.legal.funding',
  'about.legal.imageCredits',
];

export default function AboutRoute() {
  const { t } = useTranslation();
  return (
    <Screen scrollable padded>
      <View style={styles.headingBlock}>
        <Text style={styles.title}>{t('about.title')}</Text>
        <Text style={styles.description}>
          {t('about.description')}
        </Text>
      </View>

      {LEGAL_ENTRY_KEYS.map((key) => (
        <Text key={key} style={styles.entry}>
          {t(key)}
        </Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingBlock: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  entry: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    marginBottom: 12,
  },
});

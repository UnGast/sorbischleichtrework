import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePrimaryColor } from '@/hooks/usePrimaryColor';
import { withAlpha } from '@/theme/colors';

interface Props {
  completedTopics: number;
  totalTopics: number;
  masteredExercises: number;
  totalExercises: number;
  percentComplete: number; // 0..1
}

export function VocabularyProgressSummaryCard({
  completedTopics,
  totalTopics,
  masteredExercises,
  totalExercises,
  percentComplete,
}: Props) {
  const { t } = useTranslation();
  const percentLabel = Math.round(percentComplete * 100);
  const primaryColor = usePrimaryColor();
  const styles = useMemo(() => createStyles(primaryColor), [primaryColor]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('learn.progress.title')}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{percentLabel}%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{completedTopics}</Text>
          <Text style={styles.statLabel}>{t('learn.progress.topics.completed')}</Text>
          <Text style={styles.statHint}>{t('learn.progress.topics.of')} {totalTopics}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{masteredExercises}</Text>
          <Text style={styles.statLabel}>{t('learn.progress.exercises.mastered')}</Text>
          <Text style={styles.statHint}>{t('learn.progress.exercises.of')} {totalExercises}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentLabel}%` }]} />
      </View>
    </View>
  );
}
function createStyles(primaryColor: string) {
  const softPrimary = withAlpha(primaryColor, 0.12);
  const midPrimary = withAlpha(primaryColor, 0.5);
  const lightPrimary = withAlpha(primaryColor, 0.2);
  const textColor = '#111827';
  const mutedText = '#4B5563';

  return StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: lightPrimary,
      shadowColor: withAlpha('#000000', 0.08),
      shadowOpacity: 0.8,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
    },
    badge: {
      backgroundColor: softPrimary,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    badgeText: {
      color: primaryColor,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
    },
    statBlock: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: primaryColor,
    },
    statLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: textColor,
    },
    statHint: {
      fontSize: 12,
      color: mutedText,
    },
    divider: {
      width: 1,
      height: '100%',
      backgroundColor: lightPrimary,
      marginHorizontal: 12,
    },
    progressBar: {
      height: 10,
      backgroundColor: lightPrimary,
      borderRadius: 999,
      marginTop: 20,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: primaryColor,
    },
  });
}

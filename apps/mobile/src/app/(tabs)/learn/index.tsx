import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { TopicTile } from '@/components/common/TopicTile';
import { useTopicsByType, useVocabularyMap } from '@/services/content/contentRepository';
import { useAppDispatch } from '@/store';
import { setStep } from '@/services/content/vocabularySessionSlice';
import { VocabularyProgressSummaryCard } from '@/components/common/VocabularyProgressSummaryCard';
import { useVocabularyProgressSummary } from '@/hooks/useTopicsProgressSummary';

export default function VocabularyTopicsRoute() {
  const topics = useTopicsByType('vocabulary');
  const vocabularyMap = useVocabularyMap();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const progressSummary = useVocabularyProgressSummary(topics, vocabularyMap);

  return (
    <Screen>
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
            <VocabularyProgressSummaryCard
              completedTopics={progressSummary.completedTopics}
              totalTopics={progressSummary.totalTopics}
              masteredExercises={progressSummary.masteredExercises}
              totalExercises={progressSummary.totalExercises}
              percentComplete={progressSummary.percentComplete}
            />
          </View>
        )}
        renderItem={({ item }) => {
          const firstItemId = vocabularyMap[item.id]?.[0]?.id;
          const fallback = 'voc-01-01';
          const topicProgress = progressSummary.byTopic[item.id];
          const statusLabel = topicProgress
            ? `${Math.round(topicProgress.percentComplete * 100)}% · ${topicProgress.masteredExercises}/${topicProgress.totalExercises}`
            : undefined;

          return (
            <TopicTile
              name={item.nameGerman}
              subtitle={item.nameSorbian}
              statusLabel={statusLabel}
              completed={topicProgress?.isCompleted}
              onPress={() => {
                dispatch(setStep({ topicId: item.id, step: 'read' }));
                router.push({
                  pathname: `/learn/${item.id}`,
                  params: { itemId: firstItemId ?? fallback },
                });
              }}
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 12,
  },
});

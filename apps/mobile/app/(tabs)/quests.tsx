// ==========================================
// Quests Screen - All Quests for Today
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QuestCard, Card, Button } from '@/components';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { getISODate } from '@ruach/shared';

export default function QuestsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const todayQuests = useStore((state) => state.todayQuests);
  const todayState = useStore((state) => state.todayState);
  const completeQuest = useStore((state) => state.completeQuest);

  const mainQuest = todayQuests.find((q) => q.type === 'main');
  const sideQuests = todayQuests.filter((q) => q.type === 'side');
  const completedCount = todayQuests.filter((q) => q.done).length;
  const totalCount = todayQuests.length;
  const needsCheckIn = !todayState || todayState.date !== getISODate();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Just a visual refresh for now
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCompleteQuest = (questId: string) => {
    completeQuest(questId);
  };

  const goToCheckIn = () => {
    router.push('/checkin');
  };

  if (needsCheckIn || todayQuests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Нет квестов</Text>
        <Text style={styles.emptyDescription}>
          {needsCheckIn
            ? 'Пройди утренний чек-ин, чтобы получить квесты на день'
            : 'Потяни вниз на главном экране, чтобы обновить квесты'}
        </Text>
        {needsCheckIn && (
          <Button
            title="Начать день"
            onPress={goToCheckIn}
            size="large"
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Progress summary */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Прогресс</Text>
          <Text style={styles.progressCount}>
            {completedCount}/{totalCount}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' },
            ]}
          />
        </View>
        {completedCount === totalCount && totalCount > 0 && (
          <View style={styles.allDoneContainer}>
            <Ionicons name="trophy" size={20} color={Colors.trustGold} />
            <Text style={styles.allDoneText}>Все квесты выполнены!</Text>
          </View>
        )}
      </Card>

      {/* Main Quest */}
      {mainQuest && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Главный квест</Text>
          <QuestCard
            quest={mainQuest}
            onComplete={() => handleCompleteQuest(mainQuest.id)}
            expanded
          />
        </View>
      )}

      {/* Side Quests */}
      {sideQuests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Дополнительные ({sideQuests.length})</Text>
          {sideQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={() => handleCompleteQuest(quest.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptyDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: Spacing.xl,
  },
  progressCard: {
    marginBottom: Spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  progressCount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  allDoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  allDoneText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.trustGold,
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
});

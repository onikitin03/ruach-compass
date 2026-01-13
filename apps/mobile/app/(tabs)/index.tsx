// ==========================================
// Home Dashboard - "Сегодня"
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card, TrustAnchor, QuestCard, Button } from '@/components';
import { useStore } from '@/store/useStore';
import { api, fallback } from '@/services/api';
import { Colors, Spacing, FontSizes, BorderRadius, RuachStateColors } from '@/constants/theme';
import { RUACH_STATE_RU, getISODate, generateId } from '@ruach/shared';
import type { Quest, RuachState } from '@ruach/shared';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const userProfile = useStore((state) => state.userProfile);
  const todayState = useStore((state) => state.todayState);
  const todayQuests = useStore((state) => state.todayQuests);
  const currentRuachState = useStore((state) => state.currentRuachState);
  const setTodayQuests = useStore((state) => state.setTodayQuests);
  const updateRuachState = useStore((state) => state.updateRuachState);
  const completeQuest = useStore((state) => state.completeQuest);

  const mainQuest = todayQuests.find((q) => q.type === 'main');
  const sideQuests = todayQuests.filter((q) => q.type === 'side');
  const needsCheckIn = !todayState || todayState.date !== getISODate();

  // Load quests if we have today's state but no quests
  useEffect(() => {
    if (todayState && todayState.date === getISODate() && todayQuests.length === 0) {
      loadQuests();
    }
  }, [todayState]);

  const loadQuests = async () => {
    if (!todayState || !userProfile) return;

    try {
      const result = await api.generateQuests({
        dailyState: todayState,
        userProfile,
      });

      if (result.success) {
        const quests: Quest[] = result.data.quests.map((q, index) => ({
          id: generateId(),
          date: getISODate(),
          type: q.type,
          category: q.category,
          titleRu: q.titleRu,
          whyRu: q.whyRu,
          stepsRu: q.stepsRu,
          failSafeRu: q.failSafeRu,
          done: false,
          createdAt: new Date().toISOString(),
        }));

        setTodayQuests(quests);
        updateRuachState(result.data.stateAssessment.ruachState);
      } else {
        // Use fallback quests
        const fallbackData = fallback.getDefaultQuests(todayState.energy, todayState.stress);
        const quests: Quest[] = fallbackData.quests.map((q, index) => ({
          id: generateId(),
          date: getISODate(),
          type: q.type,
          category: q.category,
          titleRu: q.titleRu,
          whyRu: q.whyRu,
          stepsRu: q.stepsRu,
          failSafeRu: q.failSafeRu,
          done: false,
          createdAt: new Date().toISOString(),
        }));

        setTodayQuests(quests);
        updateRuachState(fallbackData.stateAssessment.ruachState);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuests();
    setRefreshing(false);
  };

  const handleStormPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/reset');
  };

  const handleCheckIn = () => {
    router.push('/checkin');
  };

  const handleCompleteQuest = (questId: string) => {
    completeQuest(questId);
  };

  const ruachColor = RuachStateColors[currentRuachState] || Colors.calm;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Сегодня</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <Pressable
            style={[styles.stormButton, { backgroundColor: Colors.error }]}
            onPress={handleStormPress}
          >
            <Ionicons name="flash" size={20} color={Colors.text} />
            <Text style={styles.stormButtonText}>Шторм</Text>
          </Pressable>
        </View>

        {/* Check-in prompt if needed */}
        {needsCheckIn && (
          <Card variant="highlight" style={styles.checkInCard}>
            <View style={styles.checkInContent}>
              <Ionicons name="sunny" size={32} color={Colors.primary} />
              <View style={styles.checkInText}>
                <Text style={styles.checkInTitle}>Доброе утро!</Text>
                <Text style={styles.checkInDescription}>
                  Расскажи, как ты себя чувствуешь, чтобы получить квесты на день.
                </Text>
              </View>
            </View>
            <Button title="Начать день" onPress={handleCheckIn} fullWidth />
          </Card>
        )}

        {/* Ruach State */}
        {!needsCheckIn && (
          <Card style={styles.stateCard}>
            <View style={styles.stateHeader}>
              <Text style={styles.stateLabel}>Состояние</Text>
              <View style={[styles.stateBadge, { backgroundColor: ruachColor }]}>
                <Text style={styles.stateBadgeText}>
                  {RUACH_STATE_RU[currentRuachState]}
                </Text>
              </View>
            </View>
            {todayState && (
              <View style={styles.stateDetails}>
                <View style={styles.stateDetail}>
                  <Text style={styles.stateDetailLabel}>Энергия</Text>
                  <Text style={[styles.stateDetailValue, { color: Colors.calm }]}>
                    {todayState.energy}/10
                  </Text>
                </View>
                <View style={styles.stateDetail}>
                  <Text style={styles.stateDetailLabel}>Стресс</Text>
                  <Text style={[styles.stateDetailValue, { color: Colors.triggered }]}>
                    {todayState.stress}/10
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Trust Anchor */}
        <TrustAnchor
          word={userProfile?.trustAnchorWord || 'ДОВЕРИЕ'}
          mantra="Я делаю правильно — результат не в моём контроле."
        />

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
            <Text style={styles.sectionTitle}>Дополнительные</Text>
            {sideQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={() => handleCompleteQuest(quest.id)}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {!needsCheckIn && todayQuests.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="compass-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Квестов пока нет</Text>
            <Text style={styles.emptyDescription}>
              Потяни вниз, чтобы сгенерировать квесты на сегодня.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.text,
  },
  date: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  stormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  stormButtonText: {
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  checkInCard: {
    marginBottom: Spacing.lg,
  },
  checkInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  checkInText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  checkInTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  checkInDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  stateCard: {
    marginBottom: Spacing.lg,
  },
  stateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  stateBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  stateBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.background,
  },
  stateDetails: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stateDetail: {
    flex: 1,
  },
  stateDetailLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  stateDetailValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});

// ==========================================
// Analytics Screen - User Progress & Stats
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ProgressBar, TrendBars } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { getAnalyticsData, AnalyticsData } from '@/services/supabase-data';
import { Colors, Spacing, FontSizes, BorderRadius, QuestCategoryColors } from '@/constants/theme';
import { FOCUS_AREA_RU, QUEST_CATEGORY_RU } from '@ruach/shared';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAnalyticsData(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('[Analytics] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const { streak, questStats, trends, focusDistribution } = analytics || {
    streak: 0,
    questStats: {
      totalCompleted: 0,
      totalGenerated: 0,
      completionRate: 0,
      byCategory: {},
      avgRatingByCategory: {},
    },
    trends: { dates: [], energy: [], stress: [], avgEnergy: 0, avgStress: 0 },
    focusDistribution: {},
  };

  // Calculate total focus count for percentages
  const totalFocusCount = Object.values(focusDistribution).reduce((a, b) => a + b, 0);

  // Prepare trend data for TrendBars component
  const trendData = trends.dates.map((date, i) => ({
    date,
    energy: trends.energy[i],
    stress: trends.stress[i],
  }));

  // Sort categories by total count
  const sortedCategories = Object.entries(questStats.byCategory).sort(
    ([, a], [, b]) => b.total - a.total
  );

  // Sort focus areas by count
  const sortedFocus = Object.entries(focusDistribution).sort(([, a], [, b]) => b - a);

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
      {/* Streak Card */}
      <Card style={styles.streakCard}>
        <View style={styles.streakContent}>
          {streak >= 7 ? (
            <Ionicons name="flame" size={40} color={Colors.warning} />
          ) : streak > 0 ? (
            <Ionicons name="flame-outline" size={40} color={Colors.textSecondary} />
          ) : (
            <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
          )}
          <View style={styles.streakText}>
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakLabel}>
              {streak === 0 ? 'Начни серию сегодня!' : 'дней подряд'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Quest Progress Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Квесты</Text>
        <View style={styles.questStatsRow}>
          <Text style={styles.questStatsValue}>
            {questStats.totalCompleted}
            <Text style={styles.questStatsDivider}> / {questStats.totalGenerated}</Text>
          </Text>
          <Text style={styles.questStatsLabel}>выполнено</Text>
        </View>
        <ProgressBar
          value={questStats.completionRate}
          color={Colors.success}
          showLabel
          label="Процент выполнения"
        />
      </Card>

      {/* Trends Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Энергия и стресс</Text>
        <Text style={styles.cardSubtitle}>за 7 дней</Text>
        <TrendBars data={trendData} />
        {trendData.length > 0 && (
          <View style={styles.avgRow}>
            <View style={styles.avgItem}>
              <Text style={styles.avgLabel}>Ср. энергия</Text>
              <Text style={[styles.avgValue, { color: Colors.calm }]}>
                {trends.avgEnergy.toFixed(1)}
              </Text>
            </View>
            <View style={styles.avgItem}>
              <Text style={styles.avgLabel}>Ср. стресс</Text>
              <Text style={[styles.avgValue, { color: Colors.triggered }]}>
                {trends.avgStress.toFixed(1)}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Categories Card */}
      {sortedCategories.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>По категориям</Text>
          {sortedCategories.map(([category, stats]) => {
            const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
            const avgRating = questStats.avgRatingByCategory[category];
            const color = QuestCategoryColors[category] || Colors.primary;
            const categoryName = QUEST_CATEGORY_RU[category as keyof typeof QUEST_CATEGORY_RU] || category;

            return (
              <View key={category} style={styles.categoryRow}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: color }]}>
                    <Text style={styles.categoryBadgeText}>{categoryName}</Text>
                  </View>
                  <Text style={styles.categoryStats}>
                    {stats.completed}/{stats.total}
                  </Text>
                  {avgRating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={12} color={Colors.trustGold} />
                      <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <ProgressBar value={rate} color={color} height={6} />
              </View>
            );
          })}
        </Card>
      )}

      {/* Focus Distribution Card */}
      {sortedFocus.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Фокус внимания</Text>
          {sortedFocus.map(([focus, count]) => {
            const percentage = totalFocusCount > 0 ? (count / totalFocusCount) * 100 : 0;
            const focusName = FOCUS_AREA_RU[focus as keyof typeof FOCUS_AREA_RU] || focus;

            return (
              <View key={focus} style={styles.focusRow}>
                <View style={styles.focusHeader}>
                  <Text style={styles.focusName}>{focusName}</Text>
                  <Text style={styles.focusPercentage}>{Math.round(percentage)}%</Text>
                </View>
                <ProgressBar value={percentage} color={Colors.primary} height={6} />
              </View>
            );
          })}
        </Card>
      )}

      {/* Empty state */}
      {questStats.totalGenerated === 0 && trendData.length === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="analytics-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Нет данных</Text>
          <Text style={styles.emptyText}>
            Пройди чек-ин и выполни несколько квестов, чтобы увидеть статистику
          </Text>
        </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  streakCard: {
    marginBottom: Spacing.lg,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  streakText: {
    flex: 1,
  },
  streakValue: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.text,
  },
  streakLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  questStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  questStatsValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  questStatsDivider: {
    fontSize: FontSizes.lg,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  questStatsLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  avgItem: {
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  avgValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  categoryRow: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.background,
  },
  categoryStats: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    color: Colors.trustGold,
    fontWeight: '600',
  },
  focusRow: {
    marginBottom: Spacing.md,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  focusName: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  focusPercentage: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});

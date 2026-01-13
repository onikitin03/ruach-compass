// ==========================================
// Quest Card Component
// ==========================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSizes, BorderRadius, QuestCategoryColors } from '@/constants/theme';
import { QUEST_CATEGORY_RU } from '@ruach/shared';
import type { Quest, QuestCategory } from '@ruach/shared';

interface QuestCardProps {
  quest: Quest;
  onComplete?: (rating?: number) => void;
  onPress?: () => void;
  expanded?: boolean;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onComplete,
  onPress,
  expanded = false,
}) => {
  const [showSteps, setShowSteps] = useState(expanded);
  const categoryColor = QuestCategoryColors[quest.category] || Colors.primary;

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete?.();
  };

  const toggleSteps = async () => {
    await Haptics.selectionAsync();
    setShowSteps(!showSteps);
    onPress?.();
  };

  return (
    <Pressable style={styles.container} onPress={toggleSteps}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>
            {QUEST_CATEGORY_RU[quest.category as QuestCategory]}
          </Text>
        </View>
        {quest.type === 'main' && (
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>ГЛАВНЫЙ</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, quest.done && styles.titleDone]}>
        {quest.titleRu}
      </Text>

      {/* Why - Kabbalah connection */}
      <Text style={styles.why}>{quest.whyRu}</Text>

      {/* Expandable Steps */}
      {showSteps && (
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsLabel}>Шаги:</Text>
          {quest.stepsRu.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          {/* Fail-safe */}
          <View style={styles.failSafeContainer}>
            <Ionicons name="battery-half" size={16} color={Colors.warning} />
            <Text style={styles.failSafeLabel}>Мало энергии?</Text>
            <Text style={styles.failSafeText}>{quest.failSafeRu}</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      {!quest.done && (
        <View style={styles.actions}>
          <Pressable style={styles.expandButton} onPress={toggleSteps}>
            <Ionicons
              name={showSteps ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
            <Text style={styles.expandText}>
              {showSteps ? 'Свернуть' : 'Подробнее'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.completeButton, { backgroundColor: categoryColor }]}
            onPress={handleComplete}
          >
            <Ionicons name="checkmark" size={20} color={Colors.background} />
            <Text style={styles.completeText}>Готово</Text>
          </Pressable>
        </View>
      )}

      {/* Completed state */}
      {quest.done && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.completedText}>Выполнено</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.background,
  },
  mainBadge: {
    backgroundColor: Colors.trustGold,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  mainBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.background,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  why: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  stepsContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stepsLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.background,
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  failSafeContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  failSafeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: Spacing.xs,
    marginRight: Spacing.sm,
  },
  failSafeText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  completeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: Spacing.xs,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completedText: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
});

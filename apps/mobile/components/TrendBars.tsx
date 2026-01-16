// ==========================================
// Trend Bars Component - Simple bar chart for 7-day trends
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';

interface TrendBarsProps {
  data: { energy: number; stress: number; date: string }[];
  maxValue?: number;
  height?: number;
}

export function TrendBars({ data, maxValue = 10, height = 60 }: TrendBarsProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет данных</Text>
      </View>
    );
  }

  // Get day abbreviations
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  return (
    <View style={styles.container}>
      <View style={[styles.barsContainer, { height }]}>
        {data.map((item, index) => {
          const energyHeight = (item.energy / maxValue) * height;
          const stressHeight = (item.stress / maxValue) * height;

          return (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barPair}>
                {/* Energy bar */}
                <View
                  style={[
                    styles.bar,
                    styles.energyBar,
                    { height: energyHeight },
                  ]}
                />
                {/* Stress bar */}
                <View
                  style={[
                    styles.bar,
                    styles.stressBar,
                    { height: stressHeight },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{getDayLabel(item.date)}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.calm }]} />
          <Text style={styles.legendText}>Энергия</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.triggered }]} />
          <Text style={styles.legendText}>Стресс</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 12,
    borderRadius: BorderRadius.sm,
    minHeight: 4,
  },
  energyBar: {
    backgroundColor: Colors.calm,
  },
  stressBar: {
    backgroundColor: Colors.triggered,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});

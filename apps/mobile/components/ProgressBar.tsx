// ==========================================
// Progress Bar Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/theme';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  color = Colors.primary,
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View style={styles.container}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && <Text style={styles.percentage}>{Math.round(clampedValue)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedValue}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  percentage: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  track: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.sm,
  },
});

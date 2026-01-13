// ==========================================
// Level Slider Component
// For energy/stress input (1-10)
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

interface LevelSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  color?: string;
}

export const LevelSlider: React.FC<LevelSliderProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  lowLabel,
  highLabel,
  color = Colors.primary,
}) => {
  const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const handleSelect = async (level: number) => {
    await Haptics.selectionAsync();
    onChange(level);
  };

  // Get color intensity based on value
  const getOpacity = (level: number) => {
    if (level <= value) {
      return 0.3 + (level / max) * 0.7;
    }
    return 0.1;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>

      <View style={styles.sliderContainer}>
        {levels.map((level) => (
          <Pressable
            key={level}
            style={[
              styles.levelButton,
              {
                backgroundColor: level <= value ? color : Colors.backgroundCard,
                opacity: getOpacity(level),
                borderColor: level === value ? color : Colors.border,
                borderWidth: level === value ? 2 : 1,
              },
            ]}
            onPress={() => handleSelect(level)}
          >
            <Text
              style={[
                styles.levelText,
                { color: level <= value ? Colors.background : Colors.textSecondary },
              ]}
            >
              {level}
            </Text>
          </Pressable>
        ))}
      </View>

      {(lowLabel || highLabel) && (
        <View style={styles.labelsRow}>
          <Text style={styles.endLabel}>{lowLabel}</Text>
          <Text style={styles.endLabel}>{highLabel}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  value: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelButton: {
    width: 30,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  endLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});

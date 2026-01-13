// ==========================================
// Trust Anchor Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

interface TrustAnchorProps {
  word?: string;
  mantra?: string;
  onPress?: () => void;
  compact?: boolean;
}

export const TrustAnchor: React.FC<TrustAnchorProps> = ({
  word = 'ДОВЕРИЕ',
  mantra = 'Я делаю правильно — результат не в моём контроле.',
  onPress,
  compact = false,
}) => {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  if (compact) {
    return (
      <Pressable onPress={handlePress} style={styles.compactContainer}>
        <Text style={styles.compactWord}>{word}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.wordContainer}>
        <Text style={styles.word}>{word}</Text>
      </View>
      <Text style={styles.mantra}>{mantra}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: `${Colors.trustGold}15`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.trustGold,
  },
  wordContainer: {
    backgroundColor: Colors.trustGold,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  word: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.background,
    letterSpacing: 2,
  },
  mantra: {
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  compactContainer: {
    backgroundColor: Colors.trustGold,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  compactWord: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.background,
    letterSpacing: 1,
  },
});

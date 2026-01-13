// ==========================================
// Reset Screen - 90-second Tzimtzum Protocol
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Card, TrustAnchor } from '@/components';
import { api, fallback } from '@/services/api';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { TRIGGER_TYPE_RU, type TriggerType, type ResetProtocolStep } from '@ruach/shared';

type ResetPhase = 'select' | 'running' | 'complete';

export default function ResetScreen() {
  const [phase, setPhase] = useState<ResetPhase>('select');
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [steps, setSteps] = useState<ResetProtocolStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [trustAnchor, setTrustAnchor] = useState('ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.');

  const breathAnimation = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const currentStep = steps[currentStepIndex];
  const isBreathStep = currentStep?.type === 'breath';

  // Timer effect
  useEffect(() => {
    if (phase !== 'running' || !currentStep) return;

    const duration = currentStep.durationSeconds || 10;
    setTimeLeft(duration);

    // Progress animation
    progressAnimation.setValue(0);
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: duration * 1000,
      useNativeDriver: false,
    }).start();

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          advanceStep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, currentStepIndex, currentStep]);

  // Breath animation
  useEffect(() => {
    if (!isBreathStep || phase !== 'running') {
      breathAnimation.setValue(1);
      return;
    }

    const breathCycle = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnimation, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    breathCycle.start();
    return () => breathCycle.stop();
  }, [isBreathStep, phase]);

  // Haptic feedback for steps
  useEffect(() => {
    if (phase === 'running' && currentStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [currentStepIndex, phase]);

  const selectTrigger = async (trigger: TriggerType) => {
    await Haptics.selectionAsync();
    setSelectedTrigger(trigger);
  };

  const startProtocol = async () => {
    if (!selectedTrigger) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Try to get AI-generated protocol
      const result = await api.generateReset(selectedTrigger);

      if (result.success) {
        setSteps(result.data.steps);
        setTrustAnchor(result.data.trustAnchorRu);
      } else {
        // Use fallback
        const fallbackProtocol = fallback.getResetProtocol(selectedTrigger);
        setSteps(fallbackProtocol.steps);
        setTrustAnchor(fallbackProtocol.trustAnchorRu);
      }
    } catch {
      // Use fallback on error
      const fallbackProtocol = fallback.getResetProtocol(selectedTrigger);
      setSteps(fallbackProtocol.steps);
      setTrustAnchor(fallbackProtocol.trustAnchorRu);
    }

    setCurrentStepIndex(0);
    setPhase('running');
  };

  const advanceStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setPhase('complete');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const skipStep = async () => {
    await Haptics.selectionAsync();
    advanceStep();
  };

  const handleClose = () => {
    router.back();
  };

  const renderSelectPhase = () => (
    <View style={styles.selectContainer}>
      <Text style={styles.selectTitle}>Что триггерит?</Text>
      <Text style={styles.selectDescription}>
        Выбери, что тебя сейчас штормит
      </Text>
      <View style={styles.triggerGrid}>
        {(Object.keys(TRIGGER_TYPE_RU) as TriggerType[]).map((trigger) => (
          <Pressable
            key={trigger}
            style={[
              styles.triggerOption,
              selectedTrigger === trigger && styles.triggerOptionSelected,
            ]}
            onPress={() => selectTrigger(trigger)}
          >
            <Ionicons
              name={getTriggerIcon(trigger)}
              size={24}
              color={selectedTrigger === trigger ? Colors.background : Colors.text}
            />
            <Text
              style={[
                styles.triggerOptionText,
                selectedTrigger === trigger && styles.triggerOptionTextSelected,
              ]}
            >
              {TRIGGER_TYPE_RU[trigger]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        title="Начать протокол"
        onPress={startProtocol}
        disabled={!selectedTrigger}
        fullWidth
        size="large"
      />
    </View>
  );

  const renderRunningPhase = () => {
    if (!currentStep) return null;

    const progressWidth = progressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.runningContainer}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStepIndex && styles.stepDotActive,
                index < currentStepIndex && styles.stepDotComplete,
              ]}
            />
          ))}
        </View>

        {/* Step type badge */}
        <View style={[styles.typeBadge, { backgroundColor: getStepColor(currentStep.type) }]}>
          <Text style={styles.typeBadgeText}>{getStepLabel(currentStep.type)}</Text>
        </View>

        {/* Main content */}
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{currentStep.titleRu}</Text>

          {isBreathStep && (
            <Animated.View
              style={[
                styles.breathCircle,
                { transform: [{ scale: breathAnimation }] },
              ]}
            >
              <Text style={styles.breathText}>Дыши</Text>
            </Animated.View>
          )}

          <Text style={styles.stepInstruction}>{currentStep.contentRu}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        {/* Timer */}
        <Text style={styles.timer}>{timeLeft} сек</Text>

        {/* Skip button */}
        <Pressable style={styles.skipButton} onPress={skipStep}>
          <Text style={styles.skipText}>Пропустить</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
    );
  };

  const renderCompletePhase = () => (
    <View style={styles.completeContainer}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={styles.completeTitle}>Готово</Text>
      <Text style={styles.completeDescription}>
        Ты прошёл протокол. Экран установлен.
      </Text>

      <TrustAnchor
        word="ДОВЕРИЕ"
        mantra={trustAnchor}
      />

      <View style={styles.completeActions}>
        <Button
          title="Закрыть"
          onPress={handleClose}
          fullWidth
          size="large"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {phase === 'select' ? 'Шторм' : phase === 'running' ? 'Цимцум' : 'Экран установлен'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {phase === 'select' && renderSelectPhase()}
        {phase === 'running' && renderRunningPhase()}
        {phase === 'complete' && renderCompletePhase()}
      </View>
    </SafeAreaView>
  );
}

// Helper functions
const getTriggerIcon = (trigger: TriggerType): keyof typeof Ionicons.glyphMap => {
  const icons: Record<TriggerType, keyof typeof Ionicons.glyphMap> = {
    jealousy: 'heart-dislike',
    uncertainty: 'help-circle',
    anger: 'flame',
    shame: 'eye-off',
    loneliness: 'person',
    overwhelm: 'thunderstorm',
  };
  return icons[trigger];
};

const getStepColor = (type: string): string => {
  const colors: Record<string, string> = {
    label: Colors.info,
    breath: Colors.calm,
    reframe: Colors.primary,
    action: Colors.warning,
    anchor: Colors.trustGold,
  };
  return colors[type] || Colors.primary;
};

const getStepLabel = (type: string): string => {
  const labels: Record<string, string> = {
    label: 'НАЗОВИ',
    breath: 'ДЫШИ',
    reframe: 'ЭКРАН',
    action: 'ДЕЙСТВИЕ',
    anchor: 'ЯКОРЬ',
  };
  return labels[type] || type.toUpperCase();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  // Select phase
  selectContainer: {
    flex: 1,
  },
  selectTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  selectDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  triggerGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  triggerOption: {
    width: '48%',
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  triggerOptionSelected: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  triggerOptionText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  triggerOptionTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  // Running phase
  runningContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: Colors.success,
  },
  typeBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  typeBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.background,
    letterSpacing: 1,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  breathCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${Colors.calm}30`,
    borderWidth: 3,
    borderColor: Colors.calm,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  breathText: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.calm,
  },
  stepInstruction: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: Spacing.md,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 2,
    marginTop: Spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  timer: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  // Complete phase
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  completeTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  completeDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  completeActions: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
});

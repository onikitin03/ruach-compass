// ==========================================
// Daily Check-in Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Card, LevelSlider } from '@/components';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { api, fallback } from '@/services/api';
import { saveDailyState, saveQuests } from '@/services/supabase-data';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { FOCUS_AREA_RU, generateId, getISODate, getISODateTime } from '@ruach/shared';
import type { FocusArea, Quest, DailyState } from '@ruach/shared';

type CheckInStep = 'energy' | 'stress' | 'sleep' | 'focus' | 'loading';

export default function CheckInScreen() {
  const [step, setStep] = useState<CheckInStep>('energy');
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [focus, setFocus] = useState<FocusArea>('work');

  const { user } = useAuth();
  const userProfile = useStore((state) => state.userProfile);
  const setTodayState = useStore((state) => state.setTodayState);
  const setTodayQuests = useStore((state) => state.setTodayQuests);
  const updateRuachState = useStore((state) => state.updateRuachState);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (step) {
      case 'energy':
        setStep('stress');
        break;
      case 'stress':
        setStep('sleep');
        break;
      case 'sleep':
        setStep('focus');
        break;
      case 'focus':
        await submitCheckIn();
        break;
    }
  };

  const handleBack = async () => {
    await Haptics.selectionAsync();

    switch (step) {
      case 'stress':
        setStep('energy');
        break;
      case 'sleep':
        setStep('stress');
        break;
      case 'focus':
        setStep('sleep');
        break;
    }
  };

  const selectFocus = async (f: FocusArea) => {
    await Haptics.selectionAsync();
    setFocus(f);
  };

  const submitCheckIn = async () => {
    setStep('loading');

    // Create daily state
    const dailyState: DailyState = {
      id: generateId(),
      date: getISODate(),
      energy,
      stress,
      sleepHours,
      focus,
      createdAt: getISODateTime(),
    };

    // Save state locally
    setTodayState(dailyState);

    // Save daily state to Supabase
    let dailyStateId: string | null = null;
    if (user) {
      dailyStateId = await saveDailyState(user.id, {
        date: dailyState.date,
        energy: dailyState.energy,
        stress: dailyState.stress,
        sleepHours: dailyState.sleepHours,
        focus: dailyState.focus,
      });
    }

    try {
      // Generate quests
      const result = await api.generateQuests({
        dailyState,
        userProfile: userProfile || {},
      });

      if (result.success) {
        let quests: Quest[] = result.data.quests.map((q) => ({
          id: generateId(),
          date: getISODate(),
          type: q.type,
          category: q.category,
          titleRu: q.titleRu,
          whyRu: q.whyRu,
          stepsRu: q.stepsRu,
          failSafeRu: q.failSafeRu,
          done: false,
          createdAt: getISODateTime(),
        }));

        // Save quests to Supabase and get IDs
        if (user) {
          const savedQuests = await saveQuests(user.id, dailyStateId, quests);
          if (savedQuests.length > 0) {
            // Use Supabase IDs for consistency
            quests = savedQuests.map((q) => ({
              ...q,
              createdAt: getISODateTime(),
            }));
          }
        }

        setTodayQuests(quests);
        updateRuachState(result.data.stateAssessment.ruachState);
      } else {
        // Use fallback
        const fallbackData = fallback.getDefaultQuests(energy, stress);
        let quests: Quest[] = fallbackData.quests.map((q) => ({
          id: generateId(),
          date: getISODate(),
          type: q.type,
          category: q.category,
          titleRu: q.titleRu,
          whyRu: q.whyRu,
          stepsRu: q.stepsRu,
          failSafeRu: q.failSafeRu,
          done: false,
          createdAt: getISODateTime(),
        }));

        // Save fallback quests to Supabase and get IDs
        if (user) {
          const savedQuests = await saveQuests(user.id, dailyStateId, quests);
          if (savedQuests.length > 0) {
            quests = savedQuests.map((q) => ({
              ...q,
              createdAt: getISODateTime(),
            }));
          }
        }

        setTodayQuests(quests);
        updateRuachState(fallbackData.stateAssessment.ruachState);
      }
    } catch (error) {
      console.error('Error generating quests:', error);
      // Use fallback on error
      const fallbackData = fallback.getDefaultQuests(energy, stress);
      let quests: Quest[] = fallbackData.quests.map((q) => ({
        id: generateId(),
        date: getISODate(),
        type: q.type,
        category: q.category,
        titleRu: q.titleRu,
        whyRu: q.whyRu,
        stepsRu: q.stepsRu,
        failSafeRu: q.failSafeRu,
        done: false,
        createdAt: getISODateTime(),
      }));

      // Save fallback quests to Supabase and get IDs
      if (user) {
        const savedQuests = await saveQuests(user.id, dailyStateId, quests);
        if (savedQuests.length > 0) {
          quests = savedQuests.map((q) => ({
            ...q,
            createdAt: getISODateTime(),
          }));
        }
      }

      setTodayQuests(quests);
      updateRuachState(fallbackData.stateAssessment.ruachState);
    }

    // Go back to home
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  const renderStep = () => {
    switch (step) {
      case 'energy':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Как энергия?</Text>
            <Text style={styles.stepDescription}>
              Оцени свой уровень энергии прямо сейчас
            </Text>
            <LevelSlider
              label="Энергия"
              value={energy}
              onChange={setEnergy}
              lowLabel="Истощён"
              highLabel="Полон сил"
              color={Colors.calm}
            />
          </View>
        );

      case 'stress':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Уровень стресса?</Text>
            <Text style={styles.stepDescription}>
              Насколько ты напряжён или тревожен сейчас
            </Text>
            <LevelSlider
              label="Стресс"
              value={stress}
              onChange={setStress}
              lowLabel="Спокоен"
              highLabel="Очень напряжён"
              color={Colors.triggered}
            />
          </View>
        );

      case 'sleep':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Сколько спал?</Text>
            <Text style={styles.stepDescription}>
              Сколько часов сна было этой ночью
            </Text>
            <LevelSlider
              label="Часы сна"
              value={sleepHours}
              onChange={setSleepHours}
              min={0}
              max={12}
              lowLabel="0 часов"
              highLabel="12+ часов"
              color={Colors.focused}
            />
          </View>
        );

      case 'focus':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Главный фокус?</Text>
            <Text style={styles.stepDescription}>
              На что хочешь направить внимание сегодня
            </Text>
            <View style={styles.focusOptions}>
              {(Object.keys(FOCUS_AREA_RU) as FocusArea[]).map((f) => (
                <Pressable
                  key={f}
                  style={[
                    styles.focusOption,
                    focus === f && styles.focusOptionSelected,
                  ]}
                  onPress={() => selectFocus(f)}
                >
                  <Ionicons
                    name={
                      f === 'work'
                        ? 'briefcase'
                        : f === 'relationship'
                        ? 'heart'
                        : f === 'body'
                        ? 'fitness'
                        : 'color-palette'
                    }
                    size={28}
                    color={focus === f ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.focusOptionText,
                      focus === f && styles.focusOptionTextSelected,
                    ]}
                  >
                    {FOCUS_AREA_RU[f]}
                  </Text>
                  {focus === f && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.primary}
                      style={styles.focusCheck}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'loading':
        return (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Генерирую квесты...</Text>
            <Text style={styles.loadingSubtext}>
              Подбираю задачи под твоё состояние
            </Text>
          </View>
        );
    }
  };

  const getProgress = () => {
    const steps: CheckInStep[] = ['energy', 'stress', 'sleep', 'focus'];
    const index = steps.indexOf(step);
    return ((index + 1) / steps.length) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Утренний чек-ин</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      {step !== 'loading' && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${getProgress()}%` }]} />
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      {step !== 'loading' && (
        <View style={styles.footer}>
          {step !== 'energy' && (
            <Button
              title="Назад"
              onPress={handleBack}
              variant="ghost"
              style={styles.backButton}
            />
          )}
          <Button
            title={step === 'focus' ? 'Готово' : 'Далее'}
            onPress={handleNext}
            fullWidth={step === 'energy'}
            size="large"
            style={step !== 'energy' ? styles.nextButton : undefined}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

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
  progressContainer: {
    height: 4,
    backgroundColor: Colors.backgroundCard,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  focusOptions: {
    width: '100%',
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  focusOptionSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: `${Colors.primary}10`,
  },
  focusOptionText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  focusOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  focusCheck: {
    marginLeft: Spacing.sm,
  },
  loadingContent: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  loadingSubtext: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  nextButton: {
    flex: 1,
  },
});

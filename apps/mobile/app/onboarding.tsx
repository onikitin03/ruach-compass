// ==========================================
// Onboarding Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, TrustAnchor } from '@/components';
import { useStore } from '@/store/useStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import {
  USER_VALUE_RU,
  TRIGGER_TYPE_RU,
  TONE_PREFERENCE_RU,
  generateId,
  getISODateTime,
} from '@ruach/shared';
import type { UserValue, TriggerType, TonePreference, UserProfile } from '@ruach/shared';

type OnboardingStep = 'welcome' | 'values' | 'triggers' | 'tone' | 'anchor' | 'complete';

const STEPS: OnboardingStep[] = ['welcome', 'values', 'triggers', 'tone', 'anchor', 'complete'];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedValues, setSelectedValues] = useState<UserValue[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<TriggerType[]>([]);
  const [selectedTone, setSelectedTone] = useState<TonePreference>('warm');
  const [trustAnchor, setTrustAnchor] = useState('ДОВЕРИЕ');

  const setUserProfile = useStore((state) => state.setUserProfile);
  const completeOnboarding = useStore((state) => state.completeOnboarding);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const goNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goBack = async () => {
    await Haptics.selectionAsync();
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const toggleValue = async (value: UserValue) => {
    await Haptics.selectionAsync();
    setSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const toggleTrigger = async (trigger: TriggerType) => {
    await Haptics.selectionAsync();
    setSelectedTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger]
    );
  };

  const selectTone = async (tone: TonePreference) => {
    await Haptics.selectionAsync();
    setSelectedTone(tone);
  };

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const profile: UserProfile = {
      id: generateId(),
      language: 'ru',
      values: selectedValues.length > 0 ? selectedValues : ['dignity', 'actions'],
      triggers: selectedTriggers,
      preferredTone: selectedTone,
      trustAnchorWord: trustAnchor || 'ДОВЕРИЕ',
      boundariesStyle: 'firm',
      createdAt: getISODateTime(),
      updatedAt: getISODateTime(),
    };

    setUserProfile(profile);
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'values':
        return selectedValues.length > 0;
      case 'triggers':
        return true; // triggers are optional
      case 'tone':
        return !!selectedTone;
      case 'anchor':
        return trustAnchor.length > 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.welcomeTitle}>Руах Компас</Text>
            <Text style={styles.welcomeSubtitle}>
              Твой личный помощник для возвращения к центру
            </Text>
            <View style={styles.welcomeFeatures}>
              <FeatureItem
                icon="compass"
                title="AI-квесты"
                description="Адаптивные задания под твоё состояние"
              />
              <FeatureItem
                icon="flash"
                title="2-минутный сброс"
                description="Быстрый протокол при штормах"
              />
              <FeatureItem
                icon="chatbubbles"
                title="Скрипты общения"
                description="Готовые ответы для сложных разговоров"
              />
            </View>
          </View>
        );

      case 'values':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Что для тебя важно?</Text>
            <Text style={styles.stepDescription}>
              Выбери ценности, которые резонируют. Это поможет создавать подходящие квесты.
            </Text>
            <View style={styles.optionsGrid}>
              {(Object.keys(USER_VALUE_RU) as UserValue[]).map((value) => (
                <Pressable
                  key={value}
                  style={[
                    styles.optionChip,
                    selectedValues.includes(value) && styles.optionChipSelected,
                  ]}
                  onPress={() => toggleValue(value)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedValues.includes(value) && styles.optionChipTextSelected,
                    ]}
                  >
                    {USER_VALUE_RU[value]}
                  </Text>
                  {selectedValues.includes(value) && (
                    <Ionicons name="checkmark" size={16} color={Colors.background} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'triggers':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Что обычно триггерит?</Text>
            <Text style={styles.stepDescription}>
              Это поможет быстрее подбирать нужные протоколы. Можно пропустить.
            </Text>
            <View style={styles.optionsGrid}>
              {(Object.keys(TRIGGER_TYPE_RU) as TriggerType[]).map((trigger) => (
                <Pressable
                  key={trigger}
                  style={[
                    styles.optionChip,
                    selectedTriggers.includes(trigger) && styles.optionChipSelectedDanger,
                  ]}
                  onPress={() => toggleTrigger(trigger)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedTriggers.includes(trigger) && styles.optionChipTextSelected,
                    ]}
                  >
                    {TRIGGER_TYPE_RU[trigger]}
                  </Text>
                  {selectedTriggers.includes(trigger) && (
                    <Ionicons name="checkmark" size={16} color={Colors.background} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'tone':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Какой тон общения предпочитаешь?</Text>
            <Text style={styles.stepDescription}>
              Как бы ты хотел, чтобы с тобой разговаривал приложение?
            </Text>
            <View style={styles.toneOptions}>
              {(Object.keys(TONE_PREFERENCE_RU) as TonePreference[]).map((tone) => (
                <Pressable
                  key={tone}
                  style={[
                    styles.toneOption,
                    selectedTone === tone && styles.toneOptionSelected,
                  ]}
                  onPress={() => selectTone(tone)}
                >
                  <View style={styles.toneOptionHeader}>
                    <Ionicons
                      name={
                        tone === 'warm'
                          ? 'heart'
                          : tone === 'direct'
                          ? 'flash'
                          : 'school'
                      }
                      size={24}
                      color={selectedTone === tone ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.toneOptionTitle,
                        selectedTone === tone && styles.toneOptionTitleSelected,
                      ]}
                    >
                      {TONE_PREFERENCE_RU[tone]}
                    </Text>
                  </View>
                  {selectedTone === tone && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={Colors.primary}
                      style={styles.toneCheck}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'anchor':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Твой якорь доверия</Text>
            <Text style={styles.stepDescription}>
              Слово-якорь, которое будет напоминать о главном в момент шторма.
            </Text>
            <View style={styles.anchorInput}>
              <TextInput
                style={styles.textInput}
                value={trustAnchor}
                onChangeText={setTrustAnchor}
                placeholder="ДОВЕРИЕ"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                maxLength={20}
              />
            </View>
            <View style={styles.anchorPreview}>
              <TrustAnchor word={trustAnchor || 'ДОВЕРИЕ'} />
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            <Text style={styles.completeTitle}>Готово!</Text>
            <Text style={styles.completeDescription}>
              Теперь у тебя есть личный компас. Он будет адаптироваться под твоё состояние.
            </Text>
            <Card variant="trust" style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Твои настройки:</Text>
              <Text style={styles.summaryItem}>
                Ценности: {selectedValues.map((v) => USER_VALUE_RU[v]).join(', ') || 'По умолчанию'}
              </Text>
              <Text style={styles.summaryItem}>
                Триггеры: {selectedTriggers.map((t) => TRIGGER_TYPE_RU[t]).join(', ') || 'Не указаны'}
              </Text>
              <Text style={styles.summaryItem}>
                Тон: {TONE_PREFERENCE_RU[selectedTone]}
              </Text>
              <Text style={styles.summaryItem}>
                Якорь: {trustAnchor || 'ДОВЕРИЕ'}
              </Text>
            </Card>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Back button */}
      {stepIndex > 0 && currentStep !== 'complete' && (
        <Pressable style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        {currentStep === 'complete' ? (
          <Button
            title="Начать"
            onPress={handleComplete}
            fullWidth
            size="large"
          />
        ) : (
          <Button
            title={currentStep === 'welcome' ? 'Начнём' : 'Далее'}
            onPress={goNext}
            disabled={!canProceed()}
            fullWidth
            size="large"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Feature item component
const FeatureItem = ({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color={Colors.primary} />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.backgroundCard,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    zIndex: 10,
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  stepContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  welcomeFeatures: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
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
    marginBottom: Spacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    margin: Spacing.xs,
  },
  optionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipSelectedDanger: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  optionChipText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  optionChipTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  toneOptions: {
    width: '100%',
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  toneOptionSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  toneOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toneOptionTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  toneOptionTitleSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  toneCheck: {
    marginLeft: Spacing.md,
  },
  anchorInput: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  textInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.trustGold,
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  anchorPreview: {
    width: '100%',
  },
  completeTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  completeDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    width: '100%',
  },
  summaryTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});

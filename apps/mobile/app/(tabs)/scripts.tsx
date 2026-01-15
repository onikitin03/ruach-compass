// ==========================================
// Scripts Screen - Relationship Response Scripts
// Redesigned with proper accordion UX
// ==========================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Card } from '@/components';
import { useStore } from '@/store/useStore';
import { api } from '@/services/api';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { SCENARIO_TYPE_RU, type ScenarioType, type ScriptVariants } from '@ruach/shared';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ScriptVariant = keyof ScriptVariants;

interface ScenarioData {
  scripts: ScriptVariants | null;
  toneNotes: string;
  loading: boolean;
  error: boolean;
}

const VARIANT_CONFIG: Record<ScriptVariant, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; description: string }> = {
  shortRu: {
    label: 'Короткий',
    icon: 'flash-outline',
    color: Colors.info,
    description: 'Минимальная реакция'
  },
  neutralRu: {
    label: 'Нейтральный',
    icon: 'chatbubble-outline',
    color: Colors.calm,
    description: 'Спокойный ответ'
  },
  boundaryRu: {
    label: 'Граница',
    icon: 'shield-outline',
    color: Colors.warning,
    description: 'Чёткие границы'
  },
  exitRu: {
    label: 'Выход',
    icon: 'exit-outline',
    color: Colors.error,
    description: 'Завершение разговора'
  },
};

export default function ScriptsScreen() {
  const [expandedScenario, setExpandedScenario] = useState<ScenarioType | null>(null);
  const [scenarioData, setScenarioData] = useState<Record<string, ScenarioData>>({});
  const [copiedVariant, setCopiedVariant] = useState<string | null>(null);

  const userProfile = useStore((state) => state.userProfile);
  const cacheScript = useStore((state) => state.cacheScript);
  const getCachedScript = useStore((state) => state.getCachedScript);

  const toggleScenario = useCallback(async (scenario: ScenarioType) => {
    await Haptics.selectionAsync();

    // Animate the layout change
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (expandedScenario === scenario) {
      // Collapse
      setExpandedScenario(null);
      return;
    }

    // Expand this scenario
    setExpandedScenario(scenario);

    // Check if we already have data for this scenario
    if (scenarioData[scenario]?.scripts) {
      return;
    }

    // Check cache
    const cached = getCachedScript(scenario);
    if (cached) {
      setScenarioData(prev => ({
        ...prev,
        [scenario]: {
          scripts: cached.variants,
          toneNotes: cached.toneNotesRu,
          loading: false,
          error: false,
        }
      }));
      return;
    }

    // Fetch from API
    await fetchScripts(scenario);
  }, [expandedScenario, scenarioData, getCachedScript, userProfile]);

  const fetchScripts = async (scenario: ScenarioType) => {
    // Set loading state
    setScenarioData(prev => ({
      ...prev,
      [scenario]: { scripts: null, toneNotes: '', loading: true, error: false }
    }));

    try {
      const result = await api.generateScript({
        scenarioType: scenario,
        userProfile: userProfile || {},
      });

      if (result.success && result.data?.variants) {
        setScenarioData(prev => ({
          ...prev,
          [scenario]: {
            scripts: result.data.variants,
            toneNotes: result.data.toneNotesRu || '',
            loading: false,
            error: false,
          }
        }));

        // Cache the result
        cacheScript(scenario, {
          id: scenario,
          scenarioType: scenario,
          variants: result.data.variants,
          toneNotesRu: result.data.toneNotesRu || '',
          safetyFlags: result.data.safetyFlags || [],
          generatedAt: new Date().toISOString(),
        });
      } else {
        setScenarioData(prev => ({
          ...prev,
          [scenario]: { scripts: null, toneNotes: '', loading: false, error: true }
        }));
      }
    } catch (error) {
      console.error('[Scripts] Error:', error);
      setScenarioData(prev => ({
        ...prev,
        [scenario]: { scripts: null, toneNotes: '', loading: false, error: true }
      }));
    }
  };

  const copyToClipboard = async (scenario: ScenarioType, variant: ScriptVariant, text: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(text);

    const key = `${scenario}-${variant}`;
    setCopiedVariant(key);
    setTimeout(() => setCopiedVariant(null), 2000);
  };

  const renderScriptVariant = (scenario: ScenarioType, variant: ScriptVariant, text: string) => {
    const config = VARIANT_CONFIG[variant];
    const copyKey = `${scenario}-${variant}`;
    const isCopied = copiedVariant === copyKey;

    return (
      <Pressable
        key={variant}
        style={styles.variantCard}
        onPress={() => copyToClipboard(scenario, variant, text)}
      >
        <View style={styles.variantHeader}>
          <View style={[styles.variantIcon, { backgroundColor: `${config.color}20` }]}>
            <Ionicons name={config.icon} size={18} color={config.color} />
          </View>
          <View style={styles.variantTitleContainer}>
            <Text style={[styles.variantLabel, { color: config.color }]}>{config.label}</Text>
            <Text style={styles.variantDescription}>{config.description}</Text>
          </View>
          <View style={[styles.copyIndicator, isCopied && styles.copyIndicatorActive]}>
            <Ionicons
              name={isCopied ? 'checkmark' : 'copy-outline'}
              size={16}
              color={isCopied ? Colors.success : Colors.textMuted}
            />
          </View>
        </View>
        <Text style={styles.scriptText}>{text}</Text>
        {isCopied && (
          <Text style={styles.copiedFeedback}>Скопировано!</Text>
        )}
      </Pressable>
    );
  };

  const renderExpandedContent = (scenario: ScenarioType) => {
    const data = scenarioData[scenario];

    if (!data || data.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Генерирую ответы...</Text>
        </View>
      );
    }

    if (data.error || !data.scripts) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
          <Text style={styles.errorText}>Не удалось загрузить</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => fetchScripts(scenario)}
          >
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.expandedContent}>
        {data.toneNotes && (
          <View style={styles.toneNote}>
            <Ionicons name="bulb-outline" size={16} color={Colors.trustGold} />
            <Text style={styles.toneNoteText}>{data.toneNotes}</Text>
          </View>
        )}

        <View style={styles.variantsContainer}>
          {(Object.keys(VARIANT_CONFIG) as ScriptVariant[]).map((variant) =>
            renderScriptVariant(scenario, variant, data.scripts![variant])
          )}
        </View>

        <Pressable
          style={styles.regenerateButton}
          onPress={() => fetchScripts(scenario)}
        >
          <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
          <Text style={styles.regenerateText}>Сгенерировать новые</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Скрипты ответов</Text>
        <Text style={styles.subtitle}>
          Готовые фразы для сложных разговоров
        </Text>
      </View>

      <View style={styles.scenarioList}>
        {(Object.keys(SCENARIO_TYPE_RU) as ScenarioType[]).map((scenario) => {
          const isExpanded = expandedScenario === scenario;
          const hasData = scenarioData[scenario]?.scripts;

          return (
            <View key={scenario} style={styles.accordionItem}>
              {/* Accordion Header */}
              <Pressable
                style={[
                  styles.scenarioHeader,
                  isExpanded && styles.scenarioHeaderExpanded,
                ]}
                onPress={() => toggleScenario(scenario)}
              >
                <View style={styles.scenarioTitleRow}>
                  <Text style={[
                    styles.scenarioTitle,
                    isExpanded && styles.scenarioTitleExpanded,
                  ]}>
                    {SCENARIO_TYPE_RU[scenario]}
                  </Text>
                  {hasData && !isExpanded && (
                    <View style={styles.cachedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    </View>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isExpanded ? Colors.primary : Colors.textMuted}
                />
              </Pressable>

              {/* Accordion Content */}
              {isExpanded && (
                <View style={styles.accordionContent}>
                  {renderExpandedContent(scenario)}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Нажми на вариант, чтобы скопировать
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  scenarioList: {
    paddingHorizontal: Spacing.md,
  },
  accordionItem: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  scenarioHeaderExpanded: {
    backgroundColor: `${Colors.primary}08`,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scenarioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scenarioTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  scenarioTitleExpanded: {
    color: Colors.primary,
    fontWeight: '600',
  },
  cachedBadge: {
    marginLeft: Spacing.sm,
  },
  accordionContent: {
    backgroundColor: Colors.background,
  },
  expandedContent: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  toneNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${Colors.trustGold}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  toneNoteText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginLeft: Spacing.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  variantsContainer: {
    gap: Spacing.sm,
  },
  variantCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  variantIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantTitleContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  variantLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  variantDescription: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  copyIndicator: {
    padding: Spacing.xs,
  },
  copyIndicatorActive: {
    backgroundColor: `${Colors.success}15`,
    borderRadius: BorderRadius.sm,
  },
  scriptText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
  },
  copiedFeedback: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    fontWeight: '600',
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}10`,
  },
  regenerateText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  footerText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
});

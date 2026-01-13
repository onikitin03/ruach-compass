// ==========================================
// Scripts Screen - Relationship Response Scripts
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Card, Button } from '@/components';
import { useStore } from '@/store/useStore';
import { api } from '@/services/api';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { SCENARIO_TYPE_RU, type ScenarioType, type ScriptVariants } from '@ruach/shared';

type ScriptVariant = keyof ScriptVariants;

const VARIANT_LABELS: Record<ScriptVariant, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  shortRu: { label: 'Короткий', icon: 'remove-circle', color: Colors.info },
  neutralRu: { label: 'Нейтральный', icon: 'ellipse', color: Colors.calm },
  boundaryRu: { label: 'Граница', icon: 'shield', color: Colors.warning },
  exitRu: { label: 'Выход', icon: 'exit', color: Colors.error },
};

export default function ScriptsScreen() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [scripts, setScripts] = useState<ScriptVariants | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedVariant, setCopiedVariant] = useState<ScriptVariant | null>(null);
  const [toneNotes, setToneNotes] = useState<string>('');

  const userProfile = useStore((state) => state.userProfile);
  const cacheScript = useStore((state) => state.cacheScript);
  const getCachedScript = useStore((state) => state.getCachedScript);

  const selectScenario = async (scenario: ScenarioType) => {
    await Haptics.selectionAsync();

    if (selectedScenario === scenario) {
      // Deselect
      setSelectedScenario(null);
      setScripts(null);
      setToneNotes('');
      return;
    }

    setSelectedScenario(scenario);
    setScripts(null);
    setToneNotes('');

    // Check cache first
    const cached = getCachedScript(scenario);
    if (cached) {
      setScripts(cached.variants);
      setToneNotes(cached.toneNotesRu);
      return;
    }

    // Generate new scripts
    await generateScripts(scenario);
  };

  const generateScripts = async (scenario: ScenarioType) => {
    setLoading(true);

    try {
      const result = await api.generateScript({
        scenarioType: scenario,
        userProfile: userProfile || {},
      });

      if (result.success) {
        setScripts(result.data.variants);
        setToneNotes(result.data.toneNotesRu);

        // Cache the result
        cacheScript(scenario, {
          id: scenario,
          scenarioType: scenario,
          variants: result.data.variants,
          toneNotesRu: result.data.toneNotesRu,
          safetyFlags: result.data.safetyFlags,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error generating scripts:', error);
    }

    setLoading(false);
  };

  const regenerateScripts = async () => {
    if (!selectedScenario) return;
    await generateScripts(selectedScenario);
  };

  const copyToClipboard = async (variant: ScriptVariant) => {
    if (!scripts) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(scripts[variant]);

    setCopiedVariant(variant);
    setTimeout(() => setCopiedVariant(null), 2000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Скрипты ответов</Text>
      <Text style={styles.description}>
        Выбери ситуацию — получишь 4 варианта ответа: от короткого до полного выхода.
      </Text>

      {/* Scenario list */}
      <View style={styles.scenarioList}>
        {(Object.keys(SCENARIO_TYPE_RU) as ScenarioType[]).map((scenario) => (
          <Pressable
            key={scenario}
            style={[
              styles.scenarioItem,
              selectedScenario === scenario && styles.scenarioItemSelected,
            ]}
            onPress={() => selectScenario(scenario)}
          >
            <Text
              style={[
                styles.scenarioText,
                selectedScenario === scenario && styles.scenarioTextSelected,
              ]}
            >
              {SCENARIO_TYPE_RU[scenario]}
            </Text>
            <Ionicons
              name={selectedScenario === scenario ? 'chevron-up' : 'chevron-forward'}
              size={20}
              color={selectedScenario === scenario ? Colors.primary : Colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>

      {/* Scripts display */}
      {selectedScenario && (
        <View style={styles.scriptsSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Генерирую скрипты...</Text>
            </View>
          ) : scripts ? (
            <>
              {/* Tone notes */}
              {toneNotes && (
                <Card style={styles.toneCard}>
                  <View style={styles.toneHeader}>
                    <Ionicons name="information-circle" size={20} color={Colors.info} />
                    <Text style={styles.toneLabel}>Подача</Text>
                  </View>
                  <Text style={styles.toneText}>{toneNotes}</Text>
                </Card>
              )}

              {/* Script variants */}
              {(Object.keys(VARIANT_LABELS) as ScriptVariant[]).map((variant) => {
                const variantInfo = VARIANT_LABELS[variant];
                const isCopied = copiedVariant === variant;

                return (
                  <Card key={variant} style={styles.scriptCard}>
                    <View style={styles.scriptHeader}>
                      <View style={[styles.variantBadge, { backgroundColor: variantInfo.color }]}>
                        <Ionicons name={variantInfo.icon} size={14} color={Colors.background} />
                        <Text style={styles.variantBadgeText}>{variantInfo.label}</Text>
                      </View>
                      <Pressable
                        style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
                        onPress={() => copyToClipboard(variant)}
                      >
                        <Ionicons
                          name={isCopied ? 'checkmark' : 'copy'}
                          size={16}
                          color={isCopied ? Colors.success : Colors.textSecondary}
                        />
                        <Text style={[styles.copyText, isCopied && styles.copyTextCopied]}>
                          {isCopied ? 'Скопировано' : 'Копировать'}
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={styles.scriptText}>{scripts[variant]}</Text>
                  </Card>
                );
              })}

              {/* Regenerate button */}
              <Button
                title="Сгенерировать новые"
                onPress={regenerateScripts}
                variant="secondary"
                fullWidth
              />
            </>
          ) : (
            <Card style={styles.errorCard}>
              <Ionicons name="warning" size={32} color={Colors.warning} />
              <Text style={styles.errorText}>Не удалось загрузить скрипты</Text>
              <Button
                title="Попробовать снова"
                onPress={regenerateScripts}
                variant="secondary"
                size="small"
              />
            </Card>
          )}
        </View>
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
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  scenarioList: {
    marginBottom: Spacing.lg,
  },
  scenarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scenarioItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  scenarioText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  scenarioTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scriptsSection: {
    marginTop: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  toneCard: {
    marginBottom: Spacing.lg,
    backgroundColor: `${Colors.info}10`,
    borderColor: Colors.info,
  },
  toneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  toneLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.info,
    marginLeft: Spacing.xs,
  },
  toneText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontStyle: 'italic',
  },
  scriptCard: {
    marginBottom: Spacing.md,
  },
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  variantBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: Spacing.xs,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
  },
  copyButtonCopied: {
    opacity: 1,
  },
  copyText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  copyTextCopied: {
    color: Colors.success,
  },
  scriptText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 24,
  },
  errorCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});

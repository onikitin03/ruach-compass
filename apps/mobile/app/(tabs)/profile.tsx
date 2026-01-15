// ==========================================
// Profile Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card, Button, TrustAnchor } from '@/components';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import {
  USER_VALUE_RU,
  TRIGGER_TYPE_RU,
  TONE_PREFERENCE_RU,
  getISODateTime,
} from '@ruach/shared';
import type { UserValue, TriggerType, TonePreference } from '@ruach/shared';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const userProfile = useStore((state) => state.userProfile);
  const completedQuestsCount = useStore((state) => state.completedQuestsCount);
  const setUserProfile = useStore((state) => state.setUserProfile);
  const resetAll = useStore((state) => state.resetAll);

  const [editingAnchor, setEditingAnchor] = useState(false);
  const [newAnchor, setNewAnchor] = useState(userProfile?.trustAnchorWord || 'ДОВЕРИЕ');

  if (!userProfile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Профиль не найден</Text>
      </View>
    );
  }

  const handleSaveAnchor = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setUserProfile({
      ...userProfile,
      trustAnchorWord: newAnchor || 'ДОВЕРИЕ',
      updatedAt: getISODateTime(),
    });

    setEditingAnchor(false);
  };

  const handleResetApp = () => {
    Alert.alert(
      'Сбросить приложение?',
      'Это удалит все данные и вернёт тебя на экран онбординга.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: () => {
            resetAll();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Выйти из аккаунта?',
      'Локальные данные останутся на устройстве.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const toggleValue = async (value: UserValue) => {
    await Haptics.selectionAsync();

    const currentValues = userProfile.values;
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    // Ensure at least one value is selected
    if (newValues.length === 0) return;

    setUserProfile({
      ...userProfile,
      values: newValues,
      updatedAt: getISODateTime(),
    });
  };

  const toggleTrigger = async (trigger: TriggerType) => {
    await Haptics.selectionAsync();

    const currentTriggers = userProfile.triggers;
    const newTriggers = currentTriggers.includes(trigger)
      ? currentTriggers.filter((t) => t !== trigger)
      : [...currentTriggers, trigger];

    setUserProfile({
      ...userProfile,
      triggers: newTriggers,
      updatedAt: getISODateTime(),
    });
  };

  const selectTone = async (tone: TonePreference) => {
    await Haptics.selectionAsync();

    setUserProfile({
      ...userProfile,
      preferredTone: tone,
      updatedAt: getISODateTime(),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Trust Anchor */}
      <Card variant="trust" style={styles.anchorCard}>
        {editingAnchor ? (
          <View style={styles.anchorEdit}>
            <TextInput
              style={styles.anchorInput}
              value={newAnchor}
              onChangeText={setNewAnchor}
              placeholder="ДОВЕРИЕ"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              maxLength={20}
              autoFocus
            />
            <View style={styles.anchorActions}>
              <Button
                title="Отмена"
                onPress={() => {
                  setEditingAnchor(false);
                  setNewAnchor(userProfile.trustAnchorWord);
                }}
                variant="ghost"
                size="small"
              />
              <Button
                title="Сохранить"
                onPress={handleSaveAnchor}
                size="small"
              />
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setEditingAnchor(true)}>
            <TrustAnchor word={userProfile.trustAnchorWord} />
            <Text style={styles.editHint}>Нажми, чтобы изменить якорь</Text>
          </Pressable>
        )}
      </Card>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Статистика</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedQuestsCount}</Text>
            <Text style={styles.statLabel}>Квестов выполнено</Text>
          </View>
        </View>
      </Card>

      {/* Values */}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Мои ценности</Text>
        <View style={styles.chipsContainer}>
          {(Object.keys(USER_VALUE_RU) as UserValue[]).map((value) => (
            <Pressable
              key={value}
              style={[
                styles.chip,
                userProfile.values.includes(value) && styles.chipSelected,
              ]}
              onPress={() => toggleValue(value)}
            >
              <Text
                style={[
                  styles.chipText,
                  userProfile.values.includes(value) && styles.chipTextSelected,
                ]}
              >
                {USER_VALUE_RU[value]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Triggers */}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Триггеры</Text>
        <Text style={styles.sectionDescription}>
          Для быстрого подбора протоколов
        </Text>
        <View style={styles.chipsContainer}>
          {(Object.keys(TRIGGER_TYPE_RU) as TriggerType[]).map((trigger) => (
            <Pressable
              key={trigger}
              style={[
                styles.chip,
                userProfile.triggers.includes(trigger) && styles.chipSelectedDanger,
              ]}
              onPress={() => toggleTrigger(trigger)}
            >
              <Text
                style={[
                  styles.chipText,
                  userProfile.triggers.includes(trigger) && styles.chipTextSelected,
                ]}
              >
                {TRIGGER_TYPE_RU[trigger]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Tone */}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Тон общения</Text>
        <View style={styles.toneOptions}>
          {(Object.keys(TONE_PREFERENCE_RU) as TonePreference[]).map((tone) => (
            <Pressable
              key={tone}
              style={[
                styles.toneOption,
                userProfile.preferredTone === tone && styles.toneOptionSelected,
              ]}
              onPress={() => selectTone(tone)}
            >
              <Text
                style={[
                  styles.toneOptionText,
                  userProfile.preferredTone === tone && styles.toneOptionTextSelected,
                ]}
              >
                {TONE_PREFERENCE_RU[tone]}
              </Text>
              {userProfile.preferredTone === tone && (
                <Ionicons name="checkmark" size={16} color={Colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Account */}
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Аккаунт</Text>
        <Text style={styles.accountEmail}>{user?.email || 'Не авторизован'}</Text>
        <Button
          title="Выйти из аккаунта"
          onPress={handleSignOut}
          variant="ghost"
          fullWidth
        />
      </Card>

      {/* Danger zone */}
      <Card style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Сброс</Text>
        <Text style={styles.dangerDescription}>
          Удалить все данные и начать заново
        </Text>
        <Button
          title="Сбросить приложение"
          onPress={handleResetApp}
          variant="danger"
          fullWidth
        />
      </Card>

      {/* Version */}
      <Text style={styles.version}>Руах Компас v1.0.0</Text>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  anchorCard: {
    marginBottom: Spacing.lg,
  },
  anchorEdit: {
    alignItems: 'center',
  },
  anchorInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.trustGold,
    textAlign: 'center',
    letterSpacing: 2,
    width: '100%',
    marginBottom: Spacing.md,
  },
  anchorActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  statsCard: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipSelectedDanger: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  toneOptions: {
    marginTop: Spacing.sm,
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toneOptionSelected: {
    borderColor: Colors.primary,
  },
  toneOptionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  toneOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  dangerCard: {
    marginBottom: Spacing.lg,
    backgroundColor: `${Colors.error}10`,
    borderColor: Colors.error,
  },
  dangerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  dangerDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  version: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});

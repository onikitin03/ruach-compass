// ==========================================
// Supabase Data Service - Sync with Database
// ==========================================

import { supabase } from '@/lib/supabase';
import type { UserProfile, TriggerType, TonePreference } from '@ruach/shared';

// ==========================================
// User Profile
// ==========================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.log('[DB] No profile found for user:', userId);
    return null;
  }

  // Map DB fields to app types
  return {
    id: data.id,
    language: data.language || 'ru',
    values: data.values || [],
    triggers: (data.triggers || []) as TriggerType[],
    preferredTone: (data.preferred_tone || 'warm') as TonePreference,
    trustAnchorWord: data.trust_anchor_word || 'ДОВЕРИЕ',
    boundariesStyle: data.boundaries_style || 'firm',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      language: profile.language || 'ru',
      values: profile.values || [],
      triggers: profile.triggers || [],
      preferred_tone: profile.preferredTone || 'warm',
      trust_anchor_word: profile.trustAnchorWord || 'ДОВЕРИЕ',
      boundaries_style: profile.boundariesStyle || 'firm',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('[DB] Error saving profile:', error);
    return false;
  }

  console.log('[DB] Profile saved for user:', userId);
  return true;
}

// ==========================================
// Daily States
// ==========================================

export async function saveDailyState(userId: string, state: {
  date: string;
  energy: number;
  stress: number;
  sleepHours?: number;
  focus: string;
  relationshipIntensity?: number;
  workIntensity?: number;
  notes?: string;
  ruachState?: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('daily_states')
    .upsert({
      user_id: userId,
      date: state.date,
      energy: state.energy,
      stress: state.stress,
      sleep_hours: state.sleepHours,
      focus: state.focus,
      relationship_intensity: state.relationshipIntensity,
      work_intensity: state.workIntensity,
      notes: state.notes,
      ruach_state: state.ruachState,
    }, { onConflict: 'user_id,date' })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] Error saving daily state:', error);
    return null;
  }

  return data?.id || null;
}

export async function getTodayState(userId: string): Promise<any | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_states')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error || !data) return null;
  return data;
}

// ==========================================
// Quests
// ==========================================

export async function saveQuests(userId: string, dailyStateId: string | null, quests: any[]): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];

  // Delete existing quests for today
  await supabase
    .from('quests')
    .delete()
    .eq('user_id', userId)
    .eq('date', today);

  // Insert new quests
  const questsToInsert = quests.map((q, index) => ({
    user_id: userId,
    daily_state_id: dailyStateId,
    date: today,
    type: q.type,
    category: q.category,
    title_ru: q.titleRu,
    why_ru: q.whyRu,
    steps_ru: q.stepsRu,
    fail_safe_ru: q.failSafeRu,
    done: false,
  }));

  const { data, error } = await supabase
    .from('quests')
    .insert(questsToInsert)
    .select();

  if (error) {
    console.error('[DB] Error saving quests:', error);
    return [];
  }

  // Return quests with Supabase IDs
  return (data || []).map(q => ({
    id: q.id,
    type: q.type,
    category: q.category,
    titleRu: q.title_ru,
    whyRu: q.why_ru,
    stepsRu: q.steps_ru,
    failSafeRu: q.fail_safe_ru,
    done: q.done,
    date: q.date,
  }));
}

export async function getTodayQuests(userId: string): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  // Map to app format
  return data.map(q => ({
    id: q.id,
    type: q.type,
    category: q.category,
    titleRu: q.title_ru,
    whyRu: q.why_ru,
    stepsRu: q.steps_ru,
    failSafeRu: q.fail_safe_ru,
    done: q.done,
    completedAt: q.completed_at,
    helpedRating: q.helped_rating,
    outcomeNote: q.outcome_note,
  }));
}

export async function completeQuest(questId: string, rating?: number, note?: string): Promise<boolean> {
  const { error } = await supabase
    .from('quests')
    .update({
      done: true,
      completed_at: new Date().toISOString(),
      helped_rating: rating,
      outcome_note: note,
    })
    .eq('id', questId);

  if (error) {
    console.error('[DB] Error completing quest:', error);
    return false;
  }

  return true;
}

// ==========================================
// Stats
// ==========================================

export async function getCompletedQuestsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('quests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('done', true);

  if (error) return 0;
  return count || 0;
}

// ==========================================
// Analytics
// ==========================================

export interface AnalyticsData {
  streak: number;
  questStats: {
    totalCompleted: number;
    totalGenerated: number;
    completionRate: number;
    byCategory: Record<string, { completed: number; total: number }>;
    avgRatingByCategory: Record<string, number>;
  };
  trends: {
    dates: string[];
    energy: number[];
    stress: number[];
    avgEnergy: number;
    avgStress: number;
  };
  focusDistribution: Record<string, number>;
}

/**
 * Get streak count - consecutive days with check-ins
 */
export async function getStreakCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('daily_states')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(90);

  if (error || !data || data.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < data.length; i++) {
    const checkDate = new Date(data[i].date);
    checkDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (checkDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Get quest completion stats
 */
export async function getQuestStats(userId: string): Promise<AnalyticsData['questStats']> {
  const { data, error } = await supabase
    .from('quests')
    .select('category, done, helped_rating')
    .eq('user_id', userId);

  if (error || !data) {
    return {
      totalCompleted: 0,
      totalGenerated: 0,
      completionRate: 0,
      byCategory: {},
      avgRatingByCategory: {},
    };
  }

  const totalGenerated = data.length;
  const totalCompleted = data.filter((q) => q.done).length;
  const completionRate = totalGenerated > 0 ? (totalCompleted / totalGenerated) * 100 : 0;

  const byCategory: Record<string, { completed: number; total: number }> = {};
  const ratingsByCategory: Record<string, number[]> = {};

  for (const quest of data) {
    const cat = quest.category;
    if (!byCategory[cat]) {
      byCategory[cat] = { completed: 0, total: 0 };
      ratingsByCategory[cat] = [];
    }
    byCategory[cat].total++;
    if (quest.done) {
      byCategory[cat].completed++;
      if (quest.helped_rating) {
        ratingsByCategory[cat].push(quest.helped_rating);
      }
    }
  }

  const avgRatingByCategory: Record<string, number> = {};
  for (const [cat, ratings] of Object.entries(ratingsByCategory)) {
    if (ratings.length > 0) {
      avgRatingByCategory[cat] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }
  }

  return { totalCompleted, totalGenerated, completionRate, byCategory, avgRatingByCategory };
}

/**
 * Get energy/stress trends for last N days
 */
export async function getStateTrends(
  userId: string,
  days: number = 7
): Promise<AnalyticsData['trends']> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('daily_states')
    .select('date, energy, stress')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error || !data || data.length === 0) {
    return { dates: [], energy: [], stress: [], avgEnergy: 0, avgStress: 0 };
  }

  const dates = data.map((d) => d.date);
  const energy = data.map((d) => d.energy);
  const stress = data.map((d) => d.stress);
  const avgEnergy = energy.reduce((a, b) => a + b, 0) / energy.length;
  const avgStress = stress.reduce((a, b) => a + b, 0) / stress.length;

  return { dates, energy, stress, avgEnergy, avgStress };
}

/**
 * Get focus area distribution
 */
export async function getFocusDistribution(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('daily_states')
    .select('focus')
    .eq('user_id', userId);

  if (error || !data) return {};

  const distribution: Record<string, number> = {};
  for (const state of data) {
    const focus = state.focus;
    distribution[focus] = (distribution[focus] || 0) + 1;
  }
  return distribution;
}

/**
 * Get all analytics data in one call (optimized)
 */
export async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
  const [streak, questStats, trends, focusDistribution] = await Promise.all([
    getStreakCount(userId),
    getQuestStats(userId),
    getStateTrends(userId, 7),
    getFocusDistribution(userId),
  ]);

  return { streak, questStats, trends, focusDistribution };
}

// ==========================================
// Reset / Delete
// ==========================================

/**
 * Reset today's data (for testing)
 */
export async function resetTodayData(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  // Delete today's quests
  const { error: questsError } = await supabase
    .from('quests')
    .delete()
    .eq('user_id', userId)
    .eq('date', today);

  if (questsError) {
    console.error('[DB] Error deleting quests:', questsError);
    return false;
  }

  // Delete today's daily state
  const { error: stateError } = await supabase
    .from('daily_states')
    .delete()
    .eq('user_id', userId)
    .eq('date', today);

  if (stateError) {
    console.error('[DB] Error deleting daily state:', stateError);
    return false;
  }

  console.log('[DB] Reset today data for user:', userId);
  return true;
}

/**
 * Delete all user data (for account deletion)
 */
export async function deleteAllUserData(userId: string): Promise<boolean> {
  console.log('[DB] Starting deleteAllUserData for user:', userId);

  // Delete in order: quests -> daily_states -> scripts_cache -> user_profiles
  const tables = ['quests', 'daily_states', 'scripts_cache', 'user_profiles'];

  for (const table of tables) {
    const column = table === 'user_profiles' ? 'id' : 'user_id';
    console.log(`[DB] Deleting from ${table} where ${column} = ${userId}`);

    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .eq(column, userId);

    if (error) {
      console.error(`[DB] Error deleting from ${table}:`, error.message, error.code, error.details);
      return false;
    }

    console.log(`[DB] Deleted ${count ?? 'unknown'} rows from ${table}`);
  }

  console.log('[DB] Successfully deleted all data for user:', userId);
  return true;
}

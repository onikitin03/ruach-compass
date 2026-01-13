// ==========================================
// Zustand Store - Global State Management
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  DailyState,
  Quest,
  RuachState,
  TriggerType,
  FocusArea,
  TonePreference,
  UserValue,
  ConversationScript
} from '@ruach/shared';

// Note: We're using a simple AsyncStorage wrapper since expo-sqlite
// is more complex to set up with Zustand persist

interface AppState {
  // User Profile
  userProfile: UserProfile | null;
  isOnboarded: boolean;

  // Today's state
  todayState: DailyState | null;
  currentRuachState: RuachState;

  // Quests
  todayQuests: Quest[];
  completedQuestsCount: number;

  // Scripts cache
  scriptsCache: Record<string, ConversationScript>;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions - Onboarding
  setUserProfile: (profile: UserProfile) => void;
  completeOnboarding: () => void;

  // Actions - Daily State
  setTodayState: (state: DailyState) => void;
  updateRuachState: (state: RuachState) => void;

  // Actions - Quests
  setTodayQuests: (quests: Quest[]) => void;
  completeQuest: (questId: string, rating?: number, note?: string) => void;
  clearTodayQuests: () => void;

  // Actions - Scripts
  cacheScript: (scenario: string, script: ConversationScript) => void;
  getCachedScript: (scenario: string) => ConversationScript | null;

  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Actions - Reset
  resetAll: () => void;
}

// Custom AsyncStorage wrapper for Zustand
const zustandStorage = {
  getItem: async (name: string) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};

const initialState = {
  userProfile: null,
  isOnboarded: false,
  todayState: null,
  currentRuachState: 'calm' as RuachState,
  todayQuests: [],
  completedQuestsCount: 0,
  scriptsCache: {},
  isLoading: false,
  error: null,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // User Profile Actions
      setUserProfile: (profile) => set({ userProfile: profile }),

      completeOnboarding: () => set({ isOnboarded: true }),

      // Daily State Actions
      setTodayState: (state) => set({
        todayState: state,
        // Auto-clear quests if new day
        todayQuests: state.date !== get().todayState?.date ? [] : get().todayQuests
      }),

      updateRuachState: (state) => set({ currentRuachState: state }),

      // Quest Actions
      setTodayQuests: (quests) => set({ todayQuests: quests }),

      completeQuest: (questId, rating, note) => set((state) => ({
        todayQuests: state.todayQuests.map(q =>
          q.id === questId
            ? {
                ...q,
                done: true,
                completedAt: new Date().toISOString(),
                helpedRating: rating,
                outcomeNote: note
              }
            : q
        ),
        completedQuestsCount: state.completedQuestsCount + 1
      })),

      clearTodayQuests: () => set({ todayQuests: [] }),

      // Scripts Cache Actions
      cacheScript: (scenario, script) => set((state) => ({
        scriptsCache: { ...state.scriptsCache, [scenario]: script }
      })),

      getCachedScript: (scenario) => get().scriptsCache[scenario] || null,

      // UI Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Reset
      resetAll: () => set(initialState),
    }),
    {
      name: 'ruach-compass-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        userProfile: state.userProfile,
        isOnboarded: state.isOnboarded,
        todayState: state.todayState,
        todayQuests: state.todayQuests,
        completedQuestsCount: state.completedQuestsCount,
        scriptsCache: state.scriptsCache,
      }),
    }
  )
);

// Selectors
export const selectIsOnboarded = (state: AppState) => state.isOnboarded;
export const selectUserProfile = (state: AppState) => state.userProfile;
export const selectTodayState = (state: AppState) => state.todayState;
export const selectTodayQuests = (state: AppState) => state.todayQuests;
export const selectRuachState = (state: AppState) => state.currentRuachState;
export const selectIsLoading = (state: AppState) => state.isLoading;
export const selectError = (state: AppState) => state.error;

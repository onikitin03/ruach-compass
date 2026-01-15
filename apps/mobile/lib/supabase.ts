// ==========================================
// Supabase Client Configuration
// ==========================================

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qonfmczjdicptbrfewiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbmZtY3pqZGljcHRicmZld2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTgyODQsImV4cCI6MjA4NDAzNDI4NH0.wrGrzNH2KUnyjBN1M0VW8lgk8CHFSWC_hzIWYT3WPpg';

// Custom storage adapter using SecureStore for native, localStorage for web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore storage errors on native
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore storage errors on native
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Edge Function URLs
export const EDGE_FUNCTIONS = {
  generateQuests: `${SUPABASE_URL}/functions/v1/generate-quests`,
  generateScripts: `${SUPABASE_URL}/functions/v1/generate-scripts`,
  generateReset: `${SUPABASE_URL}/functions/v1/generate-reset`,
};

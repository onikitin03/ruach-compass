// ==========================================
// Entry Point - Router based on Auth and Onboarding
// ==========================================

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { getUserProfile, getTodayQuests, getCompletedQuestsCount } from '@/services/supabase-data';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

  const isOnboarded = useStore((state) => state.isOnboarded);
  const userProfile = useStore((state) => state.userProfile);
  const setUserProfile = useStore((state) => state.setUserProfile);
  const completeOnboarding = useStore((state) => state.completeOnboarding);
  const setTodayQuests = useStore((state) => state.setTodayQuests);

  // Load user data from Supabase when user logs in
  useEffect(() => {
    async function loadUserData() {
      if (!user || hasCheckedProfile) return;

      setIsLoadingData(true);
      console.log('[INDEX] Loading user data from Supabase...');

      try {
        // Load profile from Supabase
        const profile = await getUserProfile(user.id);

        if (profile) {
          console.log('[INDEX] Found profile in Supabase');
          setUserProfile(profile);
          completeOnboarding();

          // Load today's quests
          const quests = await getTodayQuests(user.id);
          if (quests.length > 0) {
            console.log('[INDEX] Found', quests.length, 'quests for today');
            setTodayQuests(quests);
          }
        } else {
          console.log('[INDEX] No profile found in Supabase');
        }
      } catch (error) {
        console.error('[INDEX] Error loading user data:', error);
      } finally {
        setIsLoadingData(false);
        setHasCheckedProfile(true);
      }
    }

    loadUserData();
  }, [user, hasCheckedProfile]);

  // Reset check when user changes
  useEffect(() => {
    if (!user) {
      setHasCheckedProfile(false);
    }
  }, [user]);

  // Show loading while auth, data loading, or store hydrates
  if (authLoading || isLoadingData || (!hasCheckedProfile && user)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Not authenticated - go to auth screen
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // Authenticated but not onboarded - go to onboarding
  if (!isOnboarded || !userProfile) {
    return <Redirect href="/onboarding" />;
  }

  // Authenticated and onboarded - go to main app
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

// ==========================================
// Entry Point - Router to Onboarding or Main App
// ==========================================

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';

export default function Index() {
  const isOnboarded = useStore((state) => state.isOnboarded);
  const userProfile = useStore((state) => state.userProfile);

  // Show loading while store hydrates
  if (typeof isOnboarded === 'undefined') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Route based on onboarding status
  if (!isOnboarded || !userProfile) {
    return <Redirect href="/onboarding" />;
  }

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

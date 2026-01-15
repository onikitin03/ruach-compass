// ==========================================
// Entry Point - Router based on Auth and Onboarding
// ==========================================

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const isOnboarded = useStore((state) => state.isOnboarded);
  const userProfile = useStore((state) => state.userProfile);

  // Show loading while auth or store hydrates
  if (authLoading || typeof isOnboarded === 'undefined') {
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

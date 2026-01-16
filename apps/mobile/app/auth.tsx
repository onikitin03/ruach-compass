// ==========================================
// Auth Screen - Google Sign In
// ==========================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

export default function AuthScreen() {
  const { user, signInWithGoogle, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect when user is logged in
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert(
        'Ошибка входа',
        error.message || 'Не удалось войти через Google'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const loading = isLoading || isSigningIn;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Ruach Compass</Text>
          <Text style={styles.subtitle}>
            Твой проводник к внутреннему спокойствию
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color={Colors.text} />
                <Text style={styles.googleButtonText}>
                  Войти через Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Продолжая, ты соглашаешься с условиями использования
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: Spacing.xxl,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

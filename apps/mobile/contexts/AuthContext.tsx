// ==========================================
// Auth Context - Supabase Authentication
// ==========================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getUserProfile } from '@/services/supabase-data';

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = 'https://qonfmczjdicptbrfewiv.supabase.co';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync onboarding state with Supabase
  const syncOnboardingState = async (userId: string) => {
    try {
      const store = useStore.getState();
      const isOnboarded = store.isOnboarded;

      // Check if profile exists in Supabase
      const profile = await getUserProfile(userId);
      console.log('[AUTH] Sync check - profile:', !!profile, 'isOnboarded:', isOnboarded);

      if (!profile && isOnboarded) {
        // Profile was deleted but local state thinks we're onboarded
        // This happens after account deletion - reset local state
        console.log('[AUTH] Profile not found in Supabase but local isOnboarded=true, resetting...');
        store.resetAll();
        store.setCurrentUserId(userId);
      } else if (profile && !isOnboarded) {
        // Profile exists but local state says not onboarded
        // This can happen if local storage was cleared - restore onboarding state
        console.log('[AUTH] Profile found in Supabase, setting isOnboarded=true');
        store.setUserProfile(profile);
        store.completeOnboarding();
        store.setCurrentUserId(userId);
      }
    } catch (error) {
      console.error('[AUTH] Error syncing onboarding state:', error);
      // Don't block login on sync errors - just log and continue
    }
  };

  useEffect(() => {
    const checkAndResetForNewUser = useStore.getState().checkAndResetForNewUser;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AUTH] Session:', session?.user?.email ?? 'NO USER');
        setSession(session);
        setUser(session?.user ?? null);

        // Check if this is a different user and reset data if needed
        if (session?.user?.id) {
          checkAndResetForNewUser(session.user.id);
          // Sync onboarding state with Supabase (don't await - let it run in background)
          syncOnboardingState(session.user.id);
        }
      } catch (error) {
        console.error('[AUTH] Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AUTH] State changed:', session?.user?.email ?? 'NO USER');
      setSession(session);
      setUser(session?.user ?? null);

      // Check if this is a different user and reset data if needed
      if (session?.user?.id) {
        checkAndResetForNewUser(session.user.id);
        // Sync onboarding state with Supabase (don't await - let it run in background)
        syncOnboardingState(session.user.id);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      // Use Expo's auth session proxy for reliable redirects
      const redirectUrl = AuthSession.makeRedirectUri({
        native: 'ruach-compass://auth/callback',
      });

      console.log('[AUTH] Redirect URL:', redirectUrl);

      // Build the OAuth URL manually to ensure proper redirect
      const params = new URLSearchParams({
        provider: 'google',
        redirect_to: redirectUrl,
      });

      const authUrl = `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
      console.log('[AUTH] Auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        { showInRecents: true }
      );

      console.log('[AUTH] Result type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('[AUTH] Success URL:', result.url);

        // Parse the URL for tokens
        const url = result.url;

        // Check hash fragment first (implicit flow)
        if (url.includes('#')) {
          const hashParams = new URLSearchParams(url.split('#')[1]);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          console.log('[AUTH] Hash params - access_token:', !!accessToken, 'refresh_token:', !!refreshToken);

          if (accessToken && refreshToken) {
            console.log('[AUTH] Got both tokens from hash');
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            return;
          } else if (accessToken) {
            // No refresh token - this will cause issues later
            console.log('[AUTH] WARNING: Got access token but no refresh token!');
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            return;
          }
        }

        // Check query params (PKCE flow)
        if (url.includes('?')) {
          const queryParams = new URLSearchParams(url.split('?')[1].split('#')[0]);
          const code = queryParams.get('code');

          if (code) {
            console.log('[AUTH] Got code, exchanging...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            return;
          }
        }

        console.log('[AUTH] No tokens or code found in URL');
      } else if (result.type === 'cancel') {
        console.log('[AUTH] User cancelled');
      }
    } catch (error) {
      console.error('[AUTH] Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    // Clear Zustand store data (in case not already cleared)
    useStore.getState().resetAll();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// ==========================================
// Auth Context - Supabase Authentication
// ==========================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AUTH] Session:', session?.user?.email ?? 'NO USER');
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AUTH] State changed:', session?.user?.email ?? 'NO USER');
      setSession(session);
      setUser(session?.user ?? null);
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

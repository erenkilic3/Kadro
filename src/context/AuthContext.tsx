import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { storageService } from '../services/storageService';
import { PlayerPosition } from '../types';

const DEMO_AUTH_KEY = '@kadro_demo_auth_v1';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  position: PlayerPosition;
  city: string;
  district: string;
}

interface AuthActionResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  session: Session | null;
  authUser: SupabaseAuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSupabaseAuthEnabled: boolean;
  isDemoSession: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithEmail: (input: SignUpInput) => Promise<AuthActionResult>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Giriş yapmadan önce e-posta adresinizi doğrulayın.';
  }
  if (lower.includes('user already registered')) {
    return 'Bu e-posta adresiyle kayıtlı bir hesap zaten var.';
  }
  if (lower.includes('password should be at least')) {
    return 'Şifre en az 6 karakter olmalıdır.';
  }
  return message;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession warning:', error.message);
          }
          if (isMounted) {
            setSession(data.session ?? null);
            setIsDemoSession(false);
          }
        } catch (err) {
          console.warn('Supabase auth initialization failed:', err);
        } finally {
          if (isMounted) setIsAuthLoading(false);
        }
        return;
      }

      try {
        const storedDemoAuth = await AsyncStorage.getItem(DEMO_AUTH_KEY);
        if (isMounted) {
          setIsDemoSession(storedDemoAuth === 'true');
        }
      } catch (err) {
        console.warn('Demo auth restore failed:', err);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    initAuth();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      if (nextSession) {
        setIsDemoSession(false);
      }
      setIsAuthLoading(false);
    });

    const appStateSubscription =
      Platform.OS !== 'web'
        ? AppState.addEventListener('change', (state) => {
            if (!supabase) return;
            if (state === 'active') {
              supabase.auth.startAutoRefresh();
            } else {
              supabase.auth.stopAutoRefresh();
            }
          })
        : null;

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      appStateSubscription?.remove();
    };
  }, []);

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<AuthActionResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { error: 'Geçerli bir e-posta adresi girin.' };
    }
    if (password.length < 6) {
      return { error: 'Şifre en az 6 karakter olmalıdır.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        return { error: mapAuthError(error.message) };
      }
      setSession(data.session ?? null);
      setIsDemoSession(false);
      return {};
    }

    const demoUser = await storageService.getUser();
    await storageService.saveUser({
      ...demoUser,
      email: trimmedEmail,
    });
    await AsyncStorage.setItem(DEMO_AUTH_KEY, 'true');
    setIsDemoSession(true);
    return {};
  };

  const signUpWithEmail = async (input: SignUpInput): Promise<AuthActionResult> => {
    const trimmedName = input.name.trim();
    const trimmedEmail = input.email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return { error: 'Ad Soyad en az 2 karakter olmalıdır.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { error: 'Geçerli bir e-posta adresi girin.' };
    }
    if (input.password.length < 6) {
      return { error: 'Şifre en az 6 karakter olmalıdır.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: input.password,
        options: {
          data: {
            name: trimmedName,
            position: input.position,
            city: input.city,
            district: input.district,
          },
        },
      });
      if (error) {
        return { error: mapAuthError(error.message) };
      }

      if (!data.session && data.user) {
        return { needsEmailConfirmation: true };
      }

      setSession(data.session ?? null);
      setIsDemoSession(false);
      return {};
    }

    const demoUser = await storageService.getUser();
    await storageService.saveUser({
      ...demoUser,
      name: trimmedName,
      email: trimmedEmail,
      position: input.position,
      city: input.city,
      district: input.district,
    });
    await AsyncStorage.setItem(DEMO_AUTH_KEY, 'true');
    setIsDemoSession(true);
    return {};
  };

  const signInAsDemo = async (): Promise<void> => {
    await AsyncStorage.setItem(DEMO_AUTH_KEY, 'true');
    setIsDemoSession(true);
  };

  const signOut = async (): Promise<void> => {
    await AsyncStorage.removeItem(DEMO_AUTH_KEY);
    setIsDemoSession(false);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase signOut warning:', error.message);
      }
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        authUser: session?.user ?? null,
        isAuthenticated: Boolean(session?.user) || isDemoSession,
        isAuthLoading,
        isSupabaseAuthEnabled: isSupabaseConfigured,
        isDemoSession,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

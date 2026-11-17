import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { PlayerPosition } from '../types';
import {
  validateEmail,
  validatePassword,
  validateProfileInput,
} from '../utils/validators';

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
  isPasswordRecovery: boolean;
  isSupabaseAuthEnabled: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithEmail: (input: SignUpInput) => Promise<AuthActionResult>;
  sendPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
  clearPasswordRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Giriş yapmadan önce e-posta adresinize gönderilen bağlantıyı doğrulayın.';
  }
  if (lower.includes('user already registered')) {
    return 'Bu e-posta adresiyle kayıtlı bir hesap zaten var.';
  }
  if (lower.includes('password should be at least')) {
    return 'Şifre en az 6 karakter olmalıdır.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Çok fazla deneme yaptınız. Lütfen biraz bekleyip tekrar deneyin.';
  }
  return message;
}

async function handleAuthDeepLinkUrl(url: string): Promise<'recovery' | 'session' | null> {
  if (!supabase || !url) return null;

  const hashPart = url.includes('#') ? url.split('#')[1] : '';
  const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const hashParams = new URLSearchParams(hashPart);
  const queryParams = new URLSearchParams(queryPart);

  const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
  const code = queryParams.get('code');
  const type = hashParams.get('type') || queryParams.get('type');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      return type === 'recovery' || url.includes('reset-password') ? 'recovery' : 'session';
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return type === 'recovery' || url.includes('reset-password') ? 'recovery' : 'session';
    }
  }

  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) setIsAuthLoading(false);
        return;
      }

      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const linkMode = await handleAuthDeepLinkUrl(initialUrl);
          if (isMounted && linkMode === 'recovery') {
            setIsPasswordRecovery(true);
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase getSession warning:', error.message);
        }
        if (isMounted) {
          setSession(data.session ?? null);
        }
      } catch (err) {
        console.warn('Supabase auth initialization failed:', err);
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
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      setIsAuthLoading(false);
    });

    const linkingSub = Linking.addEventListener('url', async ({ url }) => {
      const linkMode = await handleAuthDeepLinkUrl(url);
      if (isMounted && linkMode === 'recovery') {
        setIsPasswordRecovery(true);
      }
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
      linkingSub.remove();
      appStateSubscription?.remove();
    };
  }, []);

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<AuthActionResult> => {
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return { error: emailCheck.error };

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) return { error: pwdCheck.error };

    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase bağlantısı yapılandırılmamış (.env dosyası eksik).',
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { error: mapAuthError(error.message) };
    }
    setSession(data.session ?? null);
    setIsPasswordRecovery(false);
    return {};
  };

  const signUpWithEmail = async (input: SignUpInput): Promise<AuthActionResult> => {
    const profileCheck = validateProfileInput(input.name, input.position);
    if (!profileCheck.valid) return { error: profileCheck.error };

    const emailCheck = validateEmail(input.email);
    if (!emailCheck.valid) return { error: emailCheck.error };

    const pwdCheck = validatePassword(input.password);
    if (!pwdCheck.valid) return { error: pwdCheck.error };

    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase bağlantısı yapılandırılmamış (.env dosyası eksik).',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: Linking.createURL('/login'),
        data: {
          name: input.name.trim(),
          position: input.position,
          city: input.city.trim() || 'İstanbul',
          district: input.district.trim() || 'Kadıköy',
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
    return {};
  };

  const sendPasswordReset = async (email: string): Promise<AuthActionResult> => {
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return { error: emailCheck.error };

    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase bağlantısı yapılandırılmamış (.env dosyası eksik).',
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: Linking.createURL('/reset-password'),
      }
    );
    if (error) {
      return { error: mapAuthError(error.message) };
    }
    return {};
  };

  const updatePassword = async (newPassword: string): Promise<AuthActionResult> => {
    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.valid) return { error: pwdCheck.error };

    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase bağlantısı yapılandırılmamış (.env dosyası eksik).',
      };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: mapAuthError(error.message) };
    }
    setIsPasswordRecovery(false);
    return {};
  };

  const clearPasswordRecovery = () => setIsPasswordRecovery(false);

  const signOut = async (): Promise<void> => {
    setIsPasswordRecovery(false);
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
        isAuthenticated: Boolean(session?.user),
        isAuthLoading,
        isPasswordRecovery,
        isSupabaseAuthEnabled: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        updatePassword,
        clearPasswordRecovery,
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

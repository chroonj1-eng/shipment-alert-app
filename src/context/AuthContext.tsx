import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, RoleType } from '../types/database';
import { getAuthRedirectUrl, parseAuthUrlCallback, clearAuthUrlParams } from '../lib/authUrl';

interface RegisterData {
  fullName?: string;
  name?: string;
  employeeId?: string;
  email: string;
  password: string;
  role?: RoleType;
  department?: string;
}

export interface AuthMessage {
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface AuthContextType {
  currentUser: Profile | null;
  session: any;
  loading: boolean;
  error: string | null;
  authMessage: AuthMessage | null;
  clearAuthMessage: () => void;
  isAdmin: boolean;
  isSRM: boolean;
  isConfigured: boolean;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  switchDemoUser: (role: 'ADMIN' | 'SRM') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<AuthMessage | null>(null);

  const clearAuthMessage = () => {
    setAuthMessage(null);
  };

  // Fetch from Supabase profiles table, or construct from Supabase Auth User & Metadata
  const fetchUserProfile = async (
    userId: string,
    userEmail?: string,
    userMeta?: any,
    userCreatedAt?: string
  ): Promise<Profile> => {
    const email = userEmail || userMeta?.email || '';
    const name = userMeta?.name || userMeta?.full_name || email.split('@')[0] || 'User';
    const fullName = userMeta?.full_name || userMeta?.name || name;
    const employeeId = userMeta?.employee_id || `UT-${userId.substring(0, 5).toUpperCase()}`;
    const role: RoleType = (userMeta?.role as RoleType) || 'SRM';
    const department = userMeta?.department || 'Ship Repair Management';
    const createdAt = userCreatedAt || userMeta?.created_at || new Date().toISOString();

    const fallbackProfile: Profile = {
      id: userId,
      email,
      name,
      full_name: fullName,
      employee_id: employeeId,
      role,
      department,
      status: 'ACTIVE',
      last_login: new Date().toISOString(),
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Try to read from public.profiles table in Supabase
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !fetchErr) {
        return {
          ...fallbackProfile,
          ...data,
          email: data.email || email,
          name: data.name || data.full_name || name,
          full_name: data.full_name || data.name || fullName,
          department: data.department || department,
          role: data.role || role,
        };
      }

      // 2. If row not found in public.profiles table, attempt to upsert
      try {
        await supabase.from('profiles').upsert(fallbackProfile);
      } catch (upsertErr) {
        console.warn('Notice: Could not upsert into public.profiles table (safe to continue with Supabase Auth session):', upsertErr);
      }

      return fallbackProfile;
    } catch (err: any) {
      console.warn('Notice: Failed reading from public.profiles, using Supabase Auth metadata:', err);
      return fallbackProfile;
    }
  };

  // Initialize session on mount and handle confirmation callbacks
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        setLoading(true);

        // 1. Inspect URL hash and query string for email confirmation or auth callbacks
        const callbackInfo = parseAuthUrlCallback();
        if (callbackInfo) {
          if (callbackInfo.isError) {
            let errorMsg = callbackInfo.errorDescription || callbackInfo.errorCode || 'Authentication failed';
            let title = 'ยืนยันตัวตนไม่สำเร็จ (Verification Failed)';

            if (callbackInfo.errorCode === 'otp_expired') {
              errorMsg = 'ลิงก์ยืนยันอีเมลหมดอายุแล้ว หรือถูกใช้งานไปแล้ว กรุณาลงทะเบียนใหม่หรือเข้าสู่ระบบ (Email confirmation link is invalid or has expired)';
            } else if (callbackInfo.errorCode === 'access_denied') {
              errorMsg = 'การเข้าถึงถูกปฏิเสธ: ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ (Access denied: verification link is invalid or expired)';
            }

            if (mounted) {
              setError(errorMsg);
              setAuthMessage({
                type: 'error',
                title,
                message: errorMsg,
              });
            }
            clearAuthUrlParams();
          } else if (callbackInfo.type === 'signup' || callbackInfo.type === 'email_change' || callbackInfo.hasToken) {
            if (mounted) {
              setAuthMessage({
                type: 'success',
                title: 'ยืนยันอีเมลสำเร็จ (Email Confirmed)',
                message: 'ยืนยันอีเมลและเปิดใช้งานบัญชีสำเร็จแล้ว ยินดีต้อนรับสู่ระบบ UNITHAI SRM (Email confirmed successfully! Welcome to UNITHAI SRM)',
              });
            }
            clearAuthUrlParams();
          } else if (callbackInfo.type === 'recovery') {
            if (mounted) {
              setAuthMessage({
                type: 'info',
                title: 'ยืนยันการรีเซ็ตรหัสผ่าน (Password Reset)',
                message: 'ตรวจสอบลิงก์กู้คืนรหัสผ่านสำเร็จ กรุณาตั้งรหัสผ่านใหม่ (Password reset link verified. Please enter your new password)',
              });
            }
            clearAuthUrlParams();
          }
        }

        // 2. Requirement 7: Check the existing Supabase session using getSession()
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Supabase getSession notice:', sessionError.message);
        }

        if (existingSession?.user && mounted) {
          setSession(existingSession);
          const profile = await fetchUserProfile(
            existingSession.user.id,
            existingSession.user.email,
            existingSession.user.user_metadata,
            existingSession.user.created_at
          );
          if (mounted) setCurrentUser(profile);
        }
      } catch (err: any) {
        console.error('Init session error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    // Requirement 8: Listen for authentication changes using onAuthStateChange()
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: any, newSession: any) => {
      if (!mounted) return;
      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession?.user) {
        const callbackInfo = parseAuthUrlCallback();
        if (callbackInfo && !callbackInfo.isError && callbackInfo.type === 'signup') {
          setAuthMessage({
            type: 'success',
            title: 'ยืนยันอีเมลสำเร็จ (Email Confirmed)',
            message: 'ยืนยันอีเมลและเปิดใช้งานบัญชีสำเร็จแล้ว ยินดีต้อนรับสู่ระบบ UNITHAI SRM',
          });
          clearAuthUrlParams();
        }
      }

      if (newSession?.user) {
        const profile = await fetchUserProfile(
          newSession.user.id,
          newSession.user.email,
          newSession.user.user_metadata,
          newSession.user.created_at
        );
        if (mounted) setCurrentUser(profile);
      } else {
        if (mounted) setCurrentUser(null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const refreshProfile = async () => {
    if (!currentUser?.id) return;
    const updated = await fetchUserProfile(currentUser.id, currentUser.email, undefined, currentUser.created_at);
    if (updated) setCurrentUser(updated);
  };

  // Requirement 2: Registration must use Supabase Auth signUp()
  // Requirement 5 & 6: Create/update user's profile in Supabase table (id, email, name, role, department, created_at)
  const register = async ({
    fullName,
    name,
    employeeId,
    email,
    password,
    role = 'SRM',
    department = 'Ship Repair Management',
  }: RegisterData) => {
    try {
      setError(null);
      setLoading(true);

      const resolvedName = (fullName || name || email.split('@')[0]).trim();
      const resolvedEmpId = employeeId ? employeeId.trim().toUpperCase() : `UT-${Math.floor(10000 + Math.random() * 90000)}`;
      const redirectUrl = getAuthRedirectUrl();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: resolvedName,
            full_name: resolvedName,
            employee_id: resolvedEmpId,
            role,
            department: department.trim(),
          },
        },
      });

      if (signUpError) {
        let msg = signUpError.message;
        if (signUpError.message.includes('already registered')) {
          msg = 'This email address is already registered. Please log in with your password.';
        }
        setError(msg);
        return { success: false, error: msg };
      }

      if (!data.user) {
        const msg = 'Registration failed: no user returned from authentication service.';
        setError(msg);
        return { success: false, error: msg };
      }

      // Prepare profile payload storing all required fields
      const profilePayload: Profile = {
        id: data.user.id,
        email: email.trim(),
        name: resolvedName,
        full_name: resolvedName,
        employee_id: resolvedEmpId,
        role,
        department: department.trim(),
        status: 'ACTIVE',
        last_login: new Date().toISOString(),
        created_at: data.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Requirement 5: Create/update user's profile in Supabase table
      try {
        await supabase.from('profiles').upsert(profilePayload);
      } catch (profileErr) {
        console.warn('Notice: Could not directly upsert to public.profiles table (safe to continue with Supabase Auth metadata):', profileErr);
      }

      // Check if email confirmation is required
      const requiresConfirmation = Boolean(data.user && !data.session);

      if (data.session) {
        setSession(data.session);
        setCurrentUser(profilePayload);
      }

      return {
        success: true,
        requiresConfirmation,
      };
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Requirement 3: Login must use Supabase Auth signInWithPassword()
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        let msg = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
          msg = 'Invalid email or password. Please verify your credentials or register a new account.';
        } else if (signInError.message.includes('Email not confirmed')) {
          msg = 'Please confirm your email address via the verification link, or disable email confirmation in Supabase Auth settings.';
        }
        setError(msg);
        return { success: false, error: msg };
      }

      if (data.session && data.user) {
        setSession(data.session);
        const profile = await fetchUserProfile(
          data.user.id,
          data.user.email,
          data.user.user_metadata,
          data.user.created_at
        );

        if (profile.status === 'INACTIVE') {
          await supabase.auth.signOut();
          setSession(null);
          setCurrentUser(null);
          const inactiveMsg = 'This account has been deactivated by the Admin.';
          setError(inactiveMsg);
          return { success: false, error: inactiveMsg };
        }

        // Record last_login in Supabase database
        const now = new Date().toISOString();
        try {
          await supabase
            .from('profiles')
            .update({ last_login: now })
            .eq('id', profile.id);
        } catch (updateErr) {
          console.warn('Notice: Could not update last_login on profiles table:', updateErr);
        }

        profile.last_login = now;
        setCurrentUser(profile);
      }

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setCurrentUser(null);
      setAuthMessage(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: sends reset email with dynamic redirect URL
  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = getAuthRedirectUrl();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (resetErr) return { success: false, error: resetErr.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Switch demo test user for fast testing (Admin vs SRM)
  const switchDemoUser = async (role: 'ADMIN' | 'SRM') => {
    const targetEmail = role === 'ADMIN' ? 'admin.somchai@unithai.com' : 'ing.srm@unithai.com';
    await login(targetEmail, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        loading,
        error,
        authMessage,
        clearAuthMessage,
        isAdmin: currentUser?.role === 'ADMIN',
        isSRM:
          currentUser?.role === 'SRM' ||
          currentUser?.role === 'CO_SRM' ||
          currentUser?.role === 'IN_CHARGE' ||
          currentUser?.role === 'ENGINEER' ||
          currentUser?.role === 'USER',
        isConfigured: isSupabaseConfigured,
        register,
        login,
        logout,
        resetPassword,
        refreshProfile,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


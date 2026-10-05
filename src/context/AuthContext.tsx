```tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, RoleType } from '../types/database';
import {
  getAuthRedirectUrl,
  parseAuthUrlCallback,
  clearAuthUrlParams,
} from '../lib/authUrl';

interface RegisterData {
  fullName?: string;
  name?: string;
  employeeId?: string;
  email: string;
  password: string;

  // Kept for compatibility with the existing UI.
  // IMPORTANT: This value is NOT trusted for authorization.
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

  register: (
    data: RegisterData
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresConfirmation?: boolean;
  }>;

  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  logout: () => Promise<void>;

  resetPassword: (
    email: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [session, setSession] = useState<any>(null);

  const [currentUser, setCurrentUser] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  const [authMessage, setAuthMessage] =
    useState<AuthMessage | null>(null);

  const clearAuthMessage = () => {
    setAuthMessage(null);
  };

  /**
   * Load user profile from public.profiles.
   *
   * SECURITY:
   * Role and status are read from public.profiles only.
   * Auth metadata is never trusted for authorization.
   */
  const fetchUserProfile = async (
    userId: string,
    userEmail?: string,
    userMeta?: any,
    userCreatedAt?: string
  ): Promise<Profile> => {
    const email =
      userEmail ||
      userMeta?.email ||
      '';

    const name =
      userMeta?.name ||
      userMeta?.full_name ||
      email.split('@')[0] ||
      'User';

    const fullName =
      userMeta?.full_name ||
      userMeta?.name ||
      name;

    const employeeId =
      userMeta?.employee_id ||
      `UT-${userId
        .substring(0, 5)
        .toUpperCase()}`;

    const department =
      userMeta?.department ||
      'Ship Repair Management';

    const createdAt =
      userCreatedAt ||
      userMeta?.created_at ||
      new Date().toISOString();

    /**
     * Safe fallback.
     *
     * IMPORTANT:
     * Do NOT use userMeta?.role here.
     */
    const fallbackProfile: Profile = {
      id: userId,
      email,
      name,
      full_name: fullName,
      employee_id: employeeId,
      role: 'SRM',
      department,
      status: 'ACTIVE',
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    };

    try {
      const {
        data,
        error: fetchErr,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchErr) {
        console.error(
          'Failed to read profile:',
          fetchErr
        );

        throw fetchErr;
      }

      /**
       * public.profiles is the source of truth.
       */
      if (data) {
        return {
          ...fallbackProfile,
          ...data,

          email:
            data.email ||
            email,

          name:
            data.name ||
            data.full_name ||
            name,

          full_name:
            data.full_name ||
            data.name ||
            fullName,

          employee_id:
            data.employee_id ||
            employeeId,

          department:
            data.department ||
            department,

          role:
            data.role as RoleType,

          status:
            data.status,
        };
      }

      /**
       * Normally this should not happen because
       * the database trigger creates the profile
       * automatically after registration.
       */
      console.warn(
        'Profile not found for authenticated user:',
        userId
      );

      return fallbackProfile;
    } catch (err: any) {
      console.error(
        'Failed to load user profile:',
        err
      );

      /**
       * Safe fallback.
       * Never use Auth metadata for role.
       */
      return fallbackProfile;
    }
  };

  /**
   * Initialize existing Supabase session.
   */
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        setLoading(true);

        /**
         * Handle email confirmation,
         * password recovery, etc.
         */
        const callbackInfo =
          parseAuthUrlCallback();

        if (callbackInfo) {
          if (callbackInfo.isError) {
            let errorMsg =
              callbackInfo.errorDescription ||
              callbackInfo.errorCode ||
              'Authentication failed';

            let title =
              'ยืนยันตัวตนไม่สำเร็จ (Verification Failed)';

            if (
              callbackInfo.errorCode ===
              'otp_expired'
            ) {
              errorMsg =
                'ลิงก์ยืนยันอีเมลหมดอายุแล้ว หรือถูกใช้งานไปแล้ว กรุณาลงทะเบียนใหม่หรือเข้าสู่ระบบ (Email confirmation link is invalid or has expired)';
            } else if (
              callbackInfo.errorCode ===
              'access_denied'
            ) {
              errorMsg =
                'การเข้าถึงถูกปฏิเสธ: ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ (Access denied: verification link is invalid or expired)';
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
          } else if (
            callbackInfo.type === 'signup' ||
            callbackInfo.type ===
              'email_change' ||
            callbackInfo.hasToken
          ) {
            if (mounted) {
              setAuthMessage({
                type: 'success',
                title:
                  'ยืนยันอีเมลสำเร็จ (Email Confirmed)',
                message:
                  'ยืนยันอีเมลและเปิดใช้งานบัญชีสำเร็จแล้ว ยินดีต้อนรับสู่ระบบ UNITHAI SRM (Email confirmed successfully! Welcome to UNITHAI SRM)',
              });
            }

            clearAuthUrlParams();
          } else if (
            callbackInfo.type ===
            'recovery'
          ) {
            if (mounted) {
              setAuthMessage({
                type: 'info',
                title:
                  'ยืนยันการรีเซ็ตรหัสผ่าน (Password Reset)',
                message:
                  'ตรวจสอบลิงก์กู้คืนรหัสผ่านสำเร็จ กรุณาตั้งรหัสผ่านใหม่ (Password reset link verified. Please enter your new password)',
              });
            }

            clearAuthUrlParams();
          }
        }

        /**
         * Get existing Supabase session.
         */
        const {
          data: {
            session: existingSession,
          },
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.warn(
            'Supabase getSession notice:',
            sessionError.message
          );
        }

        if (
          existingSession?.user &&
          mounted
        ) {
          setSession(existingSession);

          const profile =
            await fetchUserProfile(
              existingSession.user.id,
              existingSession.user.email,
              existingSession.user.user_metadata,
              existingSession.user.created_at
            );

          /**
           * Inactive accounts cannot access
           * the application.
           */
          if (
            profile.status ===
            'INACTIVE'
          ) {
            await supabase.auth.signOut();

            if (mounted) {
              setSession(null);
              setCurrentUser(null);
            }

            return;
          }

          if (mounted) {
            setCurrentUser(profile);
          }
        }
      } catch (err: any) {
        console.error(
          'Init session error:',
          err
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    /**
     * Listen for Supabase authentication changes.
     */
    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event: any,
          newSession: any
        ) => {
          if (!mounted) return;

          setSession(newSession);

          if (
            event === 'SIGNED_IN' &&
            newSession?.user
          ) {
            const callbackInfo =
              parseAuthUrlCallback();

            if (
              callbackInfo &&
              !callbackInfo.isError &&
              callbackInfo.type ===
                'signup'
            ) {
              setAuthMessage({
                type: 'success',
                title:
                  'ยืนยันอีเมลสำเร็จ (Email Confirmed)',
                message:
                  'ยืนยันอีเมลและเปิดใช้งานบัญชีสำเร็จแล้ว ยินดีต้อนรับสู่ระบบ UNITHAI SRM',
              });

              clearAuthUrlParams();
            }
          }

          if (newSession?.user) {
            const profile =
              await fetchUserProfile(
                newSession.user.id,
                newSession.user.email,
                newSession.user.user_metadata,
                newSession.user.created_at
              );

            if (
              profile.status ===
              'INACTIVE'
            ) {
              await supabase.auth.signOut();

              if (mounted) {
                setSession(null);
                setCurrentUser(null);
              }

              return;
            }

            if (mounted) {
              setCurrentUser(profile);
            }
          } else {
            if (mounted) {
              setCurrentUser(null);
            }
          }
        }
      );

    return () => {
      mounted = false;

      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  /**
   * Refresh profile from public.profiles.
   */
  const refreshProfile =
    async () => {
      if (!currentUser?.id) return;

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) return;

      const updated =
        await fetchUserProfile(
          user.id,
          user.email,
          user.user_metadata,
          user.created_at
        );

      if (
        updated.status ===
        'INACTIVE'
      ) {
        await supabase.auth.signOut();

        setSession(null);
        setCurrentUser(null);

        return;
      }

      setCurrentUser(updated);
    };

  /**
   * Register new user.
   *
   * IMPORTANT:
   * The database trigger creates the
   * public.profiles record.
   *
   * New users are always assigned SRM
   * by the database trigger.
   */
  const register = async ({
    fullName,
    name,
    employeeId,
    email,
    password,
    department = 'Ship Repair Management',
  }: RegisterData) => {
    try {
      setError(null);
      setLoading(true);

      const resolvedName =
        (
          fullName ||
          name ||
          email.split('@')[0]
        ).trim();

      const resolvedEmpId =
        employeeId
          ? employeeId
              .trim()
              .toUpperCase()
          : `UT-${Math.floor(
              10000 +
                Math.random() *
                  90000
            )}`;

      const redirectUrl =
        getAuthRedirectUrl();

      const {
        data,
        error: signUpError,
      } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,

          options: {
            emailRedirectTo:
              redirectUrl,

            data: {
              name: resolvedName,
              full_name:
                resolvedName,
              employee_id:
                resolvedEmpId,
              department:
                department.trim(),

              /**
               * Role is intentionally NOT sent.
               * The database trigger controls it.
               */
            },
          },
        });

      if (signUpError) {
        let msg =
          signUpError.message;

        if (
          signUpError.message.includes(
            'already registered'
          )
        ) {
          msg =
            'This email address is already registered. Please log in with your password.';
        }

        setError(msg);

        return {
          success: false,
          error: msg,
        };
      }

      if (!data.user) {
        const msg =
          'Registration failed: no user returned from authentication service.';

        setError(msg);

        return {
          success: false,
          error: msg,
        };
      }

      /**
       * DO NOT insert/update public.profiles here.
       *
       * Database trigger handles:
       *
       * auth.users
       *      ↓
       * handle_new_user()
       *      ↓
       * public.profiles
       *      ↓
       * role = SRM
       */
      const requiresConfirmation =
        Boolean(
          data.user &&
            !data.session
        );

      /**
       * If email confirmation is disabled
       * and a session is returned, load
       * the actual profile from database.
       */
      if (data.session) {
        setSession(data.session);

        const profile =
          await fetchUserProfile(
            data.user.id,
            data.user.email,
            data.user.user_metadata,
            data.user.created_at
          );

        setCurrentUser(profile);
      }

      return {
        success: true,
        requiresConfirmation,
      };
    } catch (err: any) {
      const msg =
        err.message ||
        'Registration failed';

      setError(msg);

      return {
        success: false,
        error: msg,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login using Supabase Auth.
   */
  const login = async (
    email: string,
    password: string
  ) => {
    try {
      setError(null);
      setLoading(true);

      const {
        data,
        error: signInError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: email.trim(),
            password,
          }
        );

      if (signInError) {
        let msg =
          signInError.message;

        if (
          signInError.message.includes(
            'Invalid login credentials'
          )
        ) {
          msg =
            'Invalid email or password. Please verify your credentials or register a new account.';
        } else if (
          signInError.message.includes(
            'Email not confirmed'
          )
        ) {
          msg =
            'Please confirm your email address via the verification link, or disable email confirmation in Supabase Auth settings.';
        }

        setError(msg);

        return {
          success: false,
          error: msg,
        };
      }

      if (
        data.session &&
        data.user
      ) {
        setSession(data.session);

        /**
         * IMPORTANT:
         * Read role/status from public.profiles.
         */
        const profile =
          await fetchUserProfile(
            data.user.id,
            data.user.email,
            data.user.user_metadata,
            data.user.created_at
          );

        /**
         * Check account status.
         */
        if (
          profile.status ===
          'INACTIVE'
        ) {
          await supabase.auth.signOut();

          setSession(null);
          setCurrentUser(null);

          const inactiveMsg =
            'This account has been deactivated by the Admin.';

          setError(
            inactiveMsg
          );

          return {
            success: false,
            error: inactiveMsg,
          };
        }

        /**
         * We intentionally do not update
         * last_login from the client.
         *
         * There is currently no UPDATE policy
         * on profiles.
         */
        setCurrentUser(profile);
      }

      return {
        success: true,
      };
    } catch (err: any) {
      const msg =
        err.message ||
        'Login failed';

      setError(msg);

      return {
        success: false,
        error: msg,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout.
   */
  const logout = async () => {
    try {
      setLoading(true);

      await supabase.auth.signOut();

      setSession(null);
      setCurrentUser(null);
      setAuthMessage(null);
    } catch (err) {
      console.error(
        'Logout error:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Forgot Password.
   */
  const resetPassword =
    async (
      email: string
    ) => {
      try {
        const redirectUrl =
          getAuthRedirectUrl();

        const {
          error: resetErr,
        } =
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                redirectUrl,
            }
          );

        if (resetErr) {
          return {
            success: false,
            error:
              resetErr.message,
          };
        }

        return {
          success: true,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
        };
      }
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

        /**
         * Authorization is based only
         * on public.profiles.role.
         */
        isAdmin:
          currentUser?.role ===
          'ADMIN',

        isSRM:
          currentUser?.role ===
            'SRM' ||
          currentUser?.role ===
            'CO_SRM' ||
          currentUser?.role ===
            'IN_CHARGE' ||
          currentUser?.role ===
            'ENGINEER' ||
          currentUser?.role ===
            'USER',

        isConfigured:
          isSupabaseConfigured,

        register,
        login,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth =
  () => {
    const context =
      useContext(
        AuthContext
      );

    if (!context) {
      throw new Error(
        'useAuth must be used within an AuthProvider'
      );
    }

    return context;
  };
```

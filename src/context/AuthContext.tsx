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
  // IMPORTANT: This value is NOT trusted for security.
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
   * Load the user's profile from public.profiles.
   *
   * SECURITY RULE:
   * Role and status MUST come from public.profiles.
   * Never trust role/status from Supabase Auth metadata.
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
      userMeta?.create
```

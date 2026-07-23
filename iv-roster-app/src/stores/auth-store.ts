import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import {
  supabase,
  signIn as supaSignIn,
  signOut as supaSignOut,
  getUserProfile,
  auditLog,
} from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'team_leader' | 'viewer';
  team: 'A' | 'B' | null;
  created_at: string;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  forcePasswordChange: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setForcePasswordChange: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  error: null,
  forcePasswordChange: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const profile = await getUserProfile();
        set({ session, profile: profile as Profile | null, isLoading: false });

        // Check force password change flag
        if (profile) {
          const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', `force_pw_change_${session.user.id}`)
            .maybeSingle();
          if (data?.value === 'true') {
            set({ forcePasswordChange: true });
          }
        }
      } else {
        set({ session: null, profile: null, isLoading: false });
      }
    } catch {
      set({ session: null, profile: null, isLoading: false });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ session: null, profile: null });
      } else if (session) {
        const profile = await getUserProfile();
        set({ session, profile: profile as Profile | null });
      }
    });
  },

  signIn: async (email: string, password: string) => {
    set({ error: null, isLoading: true });
    try {
      const { session } = await supaSignIn(email, password);
      const profile = await getUserProfile();

      if (!profile) {
        await supaSignOut();
        set({
          error: 'No profile found. Contact admin.',
          isLoading: false,
          session: null,
          profile: null,
        });
        return;
      }

      // Check force password change
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `force_pw_change_${session?.user?.id}`)
        .maybeSingle();

      set({
        session: session,
        profile: profile as Profile,
        isLoading: false,
        forcePasswordChange: data?.value === 'true',
      });

      // Audit log
      auditLog(
        'Login',
        'auth',
        `Role: ${profile.role}${profile.team ? ` Team ${profile.team}` : ''}`,
        profile.email,
        profile.name || profile.email
      );
    } catch (e: any) {
      set({
        error: e.message || 'Invalid credentials',
        isLoading: false,
      });
    }
  },

  signOut: async () => {
    await supaSignOut();
    set({ session: null, profile: null, forcePasswordChange: false });
  },

  clearError: () => set({ error: null }),
  setForcePasswordChange: (val: boolean) => set({ forcePasswordChange: val }),
}));

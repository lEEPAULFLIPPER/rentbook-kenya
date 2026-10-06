// =====================================================================
// RENTBOOK KENYA — AUTH & ROLE PERMISSIONS CONTEXT
// Supports Supabase Auth + Instant 1-Click Role Switcher & "View as" Mode
// =====================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, UserRole } from '../types';
import { DEMO_PROFILES, isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile;
  activeRole: UserRole; // effective role (takes "View As" into account)
  isViewingAs: boolean;
  viewAsRole: UserRole | null;
  setViewAsRole: (role: UserRole | null) => void;
  switchUser: (profileId: string) => void;
  allProfiles: Profile[];
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SAVED_PROFILE_KEY = 'rentbook_active_profile_id_v1';
const VIEW_AS_KEY = 'rentbook_view_as_role_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    try {
      const stored = localStorage.getItem('rentbook_profiles_v1');
      return stored ? JSON.parse(stored) : DEMO_PROFILES;
    } catch {
      return DEMO_PROFILES;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(SAVED_PROFILE_KEY);
    return saved || DEMO_PROFILES[0].id; // Default to Admin
  });

  const [viewAsRole, setViewAsRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(VIEW_AS_KEY);
    return (saved as UserRole) || null;
  });

  const currentUser =
    profiles.find((p) => p.id === currentUserId) || DEMO_PROFILES[0];

  // If Admin is in "View as" mode, effective role changes to that role
  const activeRole: UserRole =
    currentUser.role === 'admin' && viewAsRole ? viewAsRole : currentUser.role;

  const isViewingAs = currentUser.role === 'admin' && viewAsRole !== null;

  useEffect(() => {
    localStorage.setItem(SAVED_PROFILE_KEY, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    if (viewAsRole) {
      localStorage.setItem(VIEW_AS_KEY, viewAsRole);
    } else {
      localStorage.removeItem(VIEW_AS_KEY);
    }
  }, [viewAsRole]);

  // Handle live Supabase auth session if configured
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const client = supabase;

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch real profile from Supabase
        client
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              setProfiles((prev) => {
                const idx = prev.findIndex((p) => p.id === data.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = data;
                  return updated;
                }
                return [data, ...prev];
              });
              setCurrentUserId(data.id);
            }
          });
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        client
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setCurrentUserId(data.id);
            }
          });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const switchUser = (profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (target) {
      setCurrentUserId(target.id);
      setViewAsRoleState(null); // reset preview mode on user switch
    }
  };

  const setViewAsRole = (role: UserRole | null) => {
    if (currentUser.role !== 'admin') return;
    setViewAsRoleState(role);
  };

  const updateCurrentProfile = (updates: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === currentUserId ? { ...p, ...updates } : p))
    );
  };

  const loginWithEmail = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      if (password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
    }

    // Standalone fallback: Match email or create simulated session
    const match = profiles.find((p) =>
      p.full_name.toLowerCase().includes(email.split('@')[0].toLowerCase())
    );
    if (match) {
      setCurrentUserId(match.id);
      return { success: true };
    }

    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    // Switch to first admin in demo list
    setCurrentUserId(DEMO_PROFILES[0].id);
    setViewAsRoleState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        isViewingAs,
        viewAsRole,
        setViewAsRole,
        switchUser,
        allProfiles: profiles,
        isAuthenticated: true,
        loginWithEmail,
        logout,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isReseller: boolean;
  profile: Profile | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReseller, setIsReseller] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Defer backend calls (avoid calling inside the callback)
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user);
        }, 0);
      } else {
        setProfile(null);
        setIsReseller(false);
        setIsLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (authUser: User) => {
    const userId = authUser.id;
    const meta = (authUser.user_metadata || {}) as Record<string, unknown>;

    const metaName = typeof meta.name === 'string' ? meta.name : null;
    const metaRole = typeof meta.role === 'string' ? meta.role : null;
    const metaEmail = authUser.email || (typeof meta.email === 'string' ? meta.email : null);

    try {
      // 1) Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        // If RLS blocks reading, still allow UI to proceed via metadata fallback.
        // (We don't log details to avoid exposing sensitive info.)
      }

      if (profileData) {
        setProfile(profileData as Profile);
      } else if (metaEmail) {
        // UI fallback (in case the row doesn't exist yet)
        setProfile({
          id: userId,
          user_id: userId,
          name: metaName || metaEmail,
          email: metaEmail,
          phone: null,
          avatar_url: null,
        });

        // Best-effort create the profile row (may fail if policies disallow)
        await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            name: metaName || metaEmail,
            email: metaEmail,
            phone: null,
            avatar_url: null,
          })
          .then(() => void 0);
      }

      // 2) Role (reseller)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'reseller')
        .maybeSingle();

      const resellerByDb = !!roleData && !roleError;
      const resellerByMeta = metaRole === 'reseller';
      const isResellerResolved = resellerByDb || resellerByMeta;

      setIsReseller(isResellerResolved);

      // Best-effort persist reseller role for remixes/new backends
      if (!resellerByDb && resellerByMeta) {
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'reseller' })
          .then(() => void 0);
      }
    } catch {
      // Fallback: still allow reseller access if metadata says so
      setIsReseller(metaRole === 'reseller');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role: 'reseller'
          }
        }
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsReseller(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isReseller,
      profile,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantAdminSession {
  id: string;
  email: string;
  restaurant_id: string;
  restaurant_name: string;
  is_owner: boolean;
  slug: string;
  user_id: string;
}

interface RestaurantAdminContextType {
  admin: RestaurantAdminSession | null;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string, restaurantSlug: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const RestaurantAdminContext = createContext<RestaurantAdminContextType | undefined>(undefined);

export const RestaurantAdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<RestaurantAdminSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = useCallback(async (userId: string) => {
    try {
      // Fetch admin data linked to this user
      const { data: adminData, error: adminError } = await supabase
        .from('restaurant_admins')
        .select('id, email, is_owner, restaurant_id, user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminError || !adminData) {
        setAdmin(null);
        return;
      }

      // Fetch restaurant data separately
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, slug')
        .eq('id', adminData.restaurant_id)
        .maybeSingle();

      if (restaurantError || !restaurantData) {
        setAdmin(null);
        return;
      }

      const adminDataTyped = adminData as any;
      
      setAdmin({
        id: adminData.id,
        email: adminData.email,
        restaurant_id: adminData.restaurant_id,
        restaurant_name: restaurantData.name,
        is_owner: adminData.is_owner || false,
        slug: restaurantData.slug,
        user_id: adminDataTyped.user_id || userId
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Defer Supabase calls with setTimeout to avoid deadlocks
        if (currentSession?.user) {
          setTimeout(() => {
            fetchAdminData(currentSession.user.id);
          }, 0);
        } else {
          setAdmin(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchAdminData(existingSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAdminData]);

  const login = async (email: string, password: string, restaurantSlug: string): Promise<{ error: Error | null }> => {
    try {
      // First, verify the restaurant exists and get admin linked to this email
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('slug', restaurantSlug)
        .maybeSingle();

      if (restaurantError || !restaurant) {
        return { error: new Error('Restaurante não encontrado') };
      }

      // Check if there's an admin with this email for this restaurant
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('restaurant_admins')
        .select('id, email, user_id')
        .eq('restaurant_id', restaurant.id)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (adminCheckError || !adminCheck) {
        return { error: new Error('Administrador não encontrado para este restaurante') };
      }

      const adminData = adminCheck as any;
      const normalizedEmail = email.toLowerCase().trim();

      // If admin doesn't have user_id yet, perform auto-migration
      if (!adminData.user_id) {
        // Try to create the Supabase Auth user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) {
          // If user already exists, try to sign in
          if (signUpError.message.includes('already registered')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password
            });

            if (signInError) {
              return { error: new Error('Email ou senha incorretos') };
            }

            // Link the existing auth user to the admin
            if (signInData.user) {
              await supabase
                .from('restaurant_admins')
                .update({ user_id: signInData.user.id })
                .eq('id', adminData.id);

              // Add restaurant_admin role
              await supabase
                .from('user_roles')
                .upsert({ 
                  user_id: signInData.user.id, 
                  role: 'restaurant_admin' as const 
                }, { 
                  onConflict: 'user_id,role' 
                });
            }

            return { error: null };
          }
          return { error: new Error('Erro ao migrar conta: ' + signUpError.message) };
        }

        // If signup succeeded, link the new user to the admin
        if (signUpData.user) {
          await supabase
            .from('restaurant_admins')
            .update({ user_id: signUpData.user.id })
            .eq('id', adminData.id);

          // Add restaurant_admin role
          await supabase
            .from('user_roles')
            .upsert({ 
              user_id: signUpData.user.id, 
              role: 'restaurant_admin' as const 
            }, { 
              onConflict: 'user_id,role' 
            });

          // Auto-login after migration (signUp might auto-login depending on config)
          if (!signUpData.session) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password
            });

            if (signInError) {
              return { error: new Error('Conta migrada! Faça login novamente.') };
            }
          }
        }

        return { error: null };
      }

      // Sign in with Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (authError) {
        return { error: new Error('Email ou senha incorretos') };
      }

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error as Error };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setAdmin(null);
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if signOut fails
      setAdmin(null);
      setUser(null);
      setSession(null);
    }
  };

  return (
    <RestaurantAdminContext.Provider value={{ admin, user, session, isLoading, login, logout }}>
      {children}
    </RestaurantAdminContext.Provider>
  );
};

export const useRestaurantAdmin = () => {
  const context = useContext(RestaurantAdminContext);
  if (context === undefined) {
    throw new Error('useRestaurantAdmin must be used within a RestaurantAdminProvider');
  }
  return context;
};

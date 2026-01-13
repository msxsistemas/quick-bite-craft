import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantAdminSession {
  id: string;
  email: string;
  restaurant_id: string;
  restaurant_name: string;
  is_owner: boolean;
  slug: string;
}

interface RestaurantAdminContextType {
  admin: RestaurantAdminSession | null;
  isLoading: boolean;
  login: (session: RestaurantAdminSession) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const RestaurantAdminContext = createContext<RestaurantAdminContextType | undefined>(undefined);

// Generate a secure random token
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Get session token from cookie
const getSessionToken = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'restaurant_admin_session') {
      return value;
    }
  }
  return null;
};

// Set session token in cookie (httpOnly não é possível no client, mas é mais seguro que localStorage)
const setSessionCookie = (token: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000) => {
  const expires = new Date(Date.now() + expiresIn);
  document.cookie = `restaurant_admin_session=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
};

// Clear session cookie
const clearSessionCookie = () => {
  document.cookie = 'restaurant_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
};

export const RestaurantAdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<RestaurantAdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateSession = useCallback(async (): Promise<boolean> => {
    const sessionToken = getSessionToken();
    
    if (!sessionToken) {
      setAdmin(null);
      setIsLoading(false);
      return false;
    }

    try {
      // Get session from database
      const { data: session, error: sessionError } = await supabase
        .from('restaurant_admin_sessions')
        .select(`
          id,
          admin_id,
          expires_at,
          restaurant_admins!inner (
            id,
            email,
            is_owner,
            restaurant_id,
            restaurants!inner (
              id,
              name,
              slug
            )
          )
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (sessionError || !session) {
        clearSessionCookie();
        setAdmin(null);
        setIsLoading(false);
        return false;
      }

      const adminData = session.restaurant_admins as any;
      const restaurant = adminData.restaurants;

      setAdmin({
        id: adminData.id,
        email: adminData.email,
        restaurant_id: adminData.restaurant_id,
        restaurant_name: restaurant.name,
        is_owner: adminData.is_owner || false,
        slug: restaurant.slug
      });
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      clearSessionCookie();
      setAdmin(null);
      setIsLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = async (session: RestaurantAdminSession): Promise<void> => {
    try {
      const sessionToken = generateSessionToken();
      
      // Insert session into database
      const { error } = await supabase
        .from('restaurant_admin_sessions')
        .insert({
          admin_id: session.id,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      // Set cookie with token
      setSessionCookie(sessionToken);
      setAdmin(session);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const sessionToken = getSessionToken();
      
      if (sessionToken) {
        // Delete session from database
        await supabase
          .from('restaurant_admin_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }
      
      clearSessionCookie();
      setAdmin(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if DB delete fails
      clearSessionCookie();
      setAdmin(null);
    }
  };

  return (
    <RestaurantAdminContext.Provider value={{ admin, isLoading, login, logout, validateSession }}>
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

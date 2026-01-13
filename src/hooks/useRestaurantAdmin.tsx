import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
  logout: () => void;
}

const RestaurantAdminContext = createContext<RestaurantAdminContextType | undefined>(undefined);

export const RestaurantAdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<RestaurantAdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedAdmin = localStorage.getItem('restaurant_admin');
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem('restaurant_admin');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('restaurant_admin');
    setAdmin(null);
  };

  return (
    <RestaurantAdminContext.Provider value={{ admin, isLoading, logout }}>
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

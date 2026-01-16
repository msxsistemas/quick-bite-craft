import React, { createContext, useContext, ReactNode } from 'react';
import { useWaiterSettings, WaiterSettings } from '@/hooks/useWaiterSettings';

interface WaiterSettingsContextValue {
  settings: WaiterSettings;
  updateSettings: (newSettings: Partial<WaiterSettings>) => void;
  resetSettings: () => void;
  showPhotos: boolean;
  showDescriptions: boolean;
  showSoldOut: boolean;
  navigateByCategories: boolean;
  defaultTab: 'mesas' | 'comandas';
}

const WaiterSettingsContext = createContext<WaiterSettingsContextValue | undefined>(undefined);

interface WaiterSettingsProviderProps {
  children: ReactNode;
  restaurantId?: string;
}

export const WaiterSettingsProvider: React.FC<WaiterSettingsProviderProps> = ({ 
  children, 
  restaurantId 
}) => {
  const waiterSettings = useWaiterSettings(restaurantId);

  return (
    <WaiterSettingsContext.Provider value={waiterSettings}>
      {children}
    </WaiterSettingsContext.Provider>
  );
};

export const useWaiterSettingsContext = () => {
  const context = useContext(WaiterSettingsContext);
  if (context === undefined) {
    throw new Error('useWaiterSettingsContext must be used within a WaiterSettingsProvider');
  }
  return context;
};

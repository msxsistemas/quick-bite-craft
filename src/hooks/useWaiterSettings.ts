import { useState, useEffect, useCallback } from 'react';

export interface WaiterSettings {
  navegacao: 'itens' | 'categorias';
  fotos: 'exibir' | 'nao_exibir';
  descricoes: 'exibir' | 'nao_exibir';
  esgotados: 'exibir' | 'nao_exibir';
  precos: 'exibir' | 'nao_exibir';
  telaInicial: 'mesas' | 'comandas';
}

const DEFAULT_SETTINGS: WaiterSettings = {
  navegacao: 'itens',
  fotos: 'exibir',
  descricoes: 'exibir',
  esgotados: 'exibir',
  precos: 'exibir',
  telaInicial: 'mesas',
};

const STORAGE_KEY = 'waiter_settings';

export const useWaiterSettings = (restaurantId?: string) => {
  const storageKey = restaurantId ? `${STORAGE_KEY}_${restaurantId}` : STORAGE_KEY;
  
  const [settings, setSettings] = useState<WaiterSettings>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading waiter settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  // Sync with localStorage when restaurantId changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading waiter settings:', error);
      setSettings(DEFAULT_SETTINGS);
    }
  }, [storageKey]);

  const updateSettings = useCallback((newSettings: Partial<WaiterSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving waiter settings:', error);
      }
      return updated;
    });
  }, [storageKey]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error removing waiter settings:', error);
    }
  }, [storageKey]);

  return {
    settings,
    updateSettings,
    resetSettings,
    showPhotos: settings.fotos === 'exibir',
    showDescriptions: settings.descricoes === 'exibir',
    showSoldOut: settings.esgotados === 'exibir',
    showPrices: settings.precos === 'exibir',
    navigateByCategories: settings.navegacao === 'categorias',
    defaultTab: settings.telaInicial,
  };
};

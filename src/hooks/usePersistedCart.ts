import { useState, useEffect, useCallback } from 'react';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  image_url?: string | null;
}

interface PersistedCartData {
  cart: CartItem[];
  tableId?: string;
  comandaId?: string;
  timestamp: number;
}

const CART_STORAGE_KEY = 'waiter_carts';
const CART_EXPIRY_HOURS = 24; // Clear carts older than 24 hours

export const usePersistedCart = (restaurantId?: string) => {
  const getStorageKey = useCallback(() => {
    return `${CART_STORAGE_KEY}_${restaurantId || 'default'}`;
  }, [restaurantId]);

  // Load all carts from localStorage
  const loadAllCarts = useCallback((): Record<string, PersistedCartData> => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return {};
      
      const carts = JSON.parse(stored) as Record<string, PersistedCartData>;
      const now = Date.now();
      const expiryMs = CART_EXPIRY_HOURS * 60 * 60 * 1000;
      
      // Filter out expired carts
      const validCarts: Record<string, PersistedCartData> = {};
      Object.entries(carts).forEach(([key, data]) => {
        if (now - data.timestamp < expiryMs) {
          validCarts[key] = data;
        }
      });
      
      return validCarts;
    } catch {
      return {};
    }
  }, [getStorageKey]);

  // Save cart for a specific table or comanda
  const saveCart = useCallback((
    cart: CartItem[],
    options: { tableId?: string; comandaId?: string }
  ) => {
    const { tableId, comandaId } = options;
    const key = tableId ? `table_${tableId}` : comandaId ? `comanda_${comandaId}` : null;
    
    if (!key) return;
    
    const allCarts = loadAllCarts();
    
    if (cart.length === 0) {
      // Remove cart if empty
      delete allCarts[key];
    } else {
      allCarts[key] = {
        cart,
        tableId,
        comandaId,
        timestamp: Date.now()
      };
    }
    
    localStorage.setItem(getStorageKey(), JSON.stringify(allCarts));
  }, [getStorageKey, loadAllCarts]);

  // Load cart for a specific table or comanda
  const loadCart = useCallback((
    options: { tableId?: string; comandaId?: string }
  ): CartItem[] => {
    const { tableId, comandaId } = options;
    const key = tableId ? `table_${tableId}` : comandaId ? `comanda_${comandaId}` : null;
    
    if (!key) return [];
    
    const allCarts = loadAllCarts();
    return allCarts[key]?.cart || [];
  }, [loadAllCarts]);

  // Clear cart for a specific table or comanda
  const clearCart = useCallback((
    options: { tableId?: string; comandaId?: string }
  ) => {
    const { tableId, comandaId } = options;
    const key = tableId ? `table_${tableId}` : comandaId ? `comanda_${comandaId}` : null;
    
    if (!key) return;
    
    const allCarts = loadAllCarts();
    delete allCarts[key];
    localStorage.setItem(getStorageKey(), JSON.stringify(allCarts));
  }, [getStorageKey, loadAllCarts]);

  // Clear all carts
  const clearAllCarts = useCallback(() => {
    localStorage.removeItem(getStorageKey());
  }, [getStorageKey]);

  // Get cart items count for a specific table or comanda
  const getCartItemsCount = useCallback((
    options: { tableId?: string; comandaId?: string }
  ): number => {
    const cart = loadCart(options);
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [loadCart]);

  // Get all carts with items (for displaying badges)
  const getAllCartsWithItems = useCallback((): Record<string, number> => {
    const allCarts = loadAllCarts();
    const result: Record<string, number> = {};
    
    Object.entries(allCarts).forEach(([key, data]) => {
      const count = data.cart.reduce((sum, item) => sum + item.quantity, 0);
      if (count > 0) {
        result[key] = count;
      }
    });
    
    return result;
  }, [loadAllCarts]);

  return {
    saveCart,
    loadCart,
    clearCart,
    clearAllCarts,
    getCartItemsCount,
    getAllCartsWithItems
  };
};

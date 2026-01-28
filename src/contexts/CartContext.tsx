import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CartItem, CartItemExtra, Product } from '@/types/delivery';

const CART_STORAGE_KEY = 'customer_cart';
const CART_EXPIRY_HOURS = 24;

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, extras?: CartItemExtra[], notes?: string) => void;
  removeItem: (itemIndex: number) => void;
  updateQuantity: (itemIndex: number, quantity: number) => void;
  updateItemNotes: (itemIndex: number, notes: string | undefined) => void;
  updateItem: (itemIndex: number, quantity: number, extras?: CartItemExtra[], notes?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getStorageKey = (slug: string | undefined) => `${CART_STORAGE_KEY}_${slug || 'default'}`;

const loadCartFromStorage = (slug: string | undefined): CartItem[] => {
  try {
    const stored = localStorage.getItem(getStorageKey(slug));
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    const now = Date.now();
    const expiryMs = CART_EXPIRY_HOURS * 60 * 60 * 1000;
    
    // Check if cart is expired
    if (data.timestamp && now - data.timestamp > expiryMs) {
      localStorage.removeItem(getStorageKey(slug));
      return [];
    }
    
    return data.items || [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (slug: string | undefined, items: CartItem[]) => {
  try {
    if (items.length === 0) {
      localStorage.removeItem(getStorageKey(slug));
    } else {
      localStorage.setItem(getStorageKey(slug), JSON.stringify({
        items,
        timestamp: Date.now()
      }));
    }
  } catch {
    // Ignore storage errors
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage(slug));
  const [isOpen, setIsOpen] = useState(false);

  // Load cart when slug changes
  useEffect(() => {
    setItems(loadCartFromStorage(slug));
  }, [slug]);

  // Save cart whenever items change
  useEffect(() => {
    saveCartToStorage(slug, items);
  }, [items, slug]);

  const addItem = (product: Product, quantity = 1, extras?: CartItemExtra[], notes?: string) => {
    setItems(prevItems => {
      // Each item with different extras/notes is a separate cart item
      const extrasKey = extras?.map(e => e.optionId).sort().join('|') || '';
      const notesKey = notes || '';
      
      const existingIndex = prevItems.findIndex(item => {
        const itemExtrasKey = item.extras?.map(e => e.optionId).sort().join('|') || '';
        const itemNotesKey = item.notes || '';
        return item.product.id === product.id && itemExtrasKey === extrasKey && itemNotesKey === notesKey;
      });
      
      if (existingIndex >= 0) {
        return prevItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, { product, quantity, extras, notes }];
    });
  };

  const removeItem = (itemIndex: number) => {
    setItems(prevItems => prevItems.filter((_, index) => index !== itemIndex));
  };

  const updateQuantity = (itemIndex: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemIndex);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map((item, index) =>
        index === itemIndex
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updateItemNotes = (itemIndex: number, notes: string | undefined) => {
    setItems(prevItems =>
      prevItems.map((item, index) =>
        index === itemIndex
          ? { ...item, notes }
          : item
      )
    );
  };

  const updateItem = (itemIndex: number, quantity: number, extras?: CartItemExtra[], notes?: string) => {
    if (quantity <= 0) {
      removeItem(itemIndex);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map((item, index) =>
        index === itemIndex
          ? { ...item, quantity, extras, notes }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
      const itemPrice = item.product.price + extrasTotal;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateItemNotes,
      updateItem,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isOpen,
      setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

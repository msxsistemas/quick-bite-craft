import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, CartItemExtra, Product } from '@/types/delivery';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, extras?: CartItemExtra[], notes?: string) => void;
  removeItem: (itemIndex: number) => void;
  updateQuantity: (itemIndex: number, quantity: number) => void;
  updateItemNotes: (itemIndex: number, notes: string | undefined) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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

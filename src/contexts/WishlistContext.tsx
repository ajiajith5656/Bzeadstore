import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../types';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncToBackend: (userId: string) => Promise<void>;
  loadFromBackend: (userId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('beauzead_wishlist');
    if (savedWishlist) {
      try { setItems(JSON.parse(savedWishlist)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('beauzead_wishlist', JSON.stringify(items));
  }, [items]);

  const syncToBackend = async (_userId: string) => {
    // TODO: Connect to your backend API
  };

  const loadFromBackend = async (_userId: string) => {
    // TODO: Connect to your backend API
  };

  const addToWishlist = (product: Product) => {
    setItems((prev) => {
      if (!prev.find((item) => item.id === product.id)) return [...prev, product];
      return prev;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const isInWishlist = (productId: string) => items.some((item) => item.id === productId);

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist, syncToBackend, loadFromBackend }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

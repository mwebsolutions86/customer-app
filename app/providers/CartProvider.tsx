import React, { createContext, useContext, useState } from 'react';

// --- TYPES ---
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

// 1. Création du contexte
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  total: 0,
  count: 0,
});

// 2. Le Provider (L'enveloppe qui donne accès au panier)
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // AJOUTER AU PANIER
  const addItem = (product: any) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Si existe déjà, on augmente la quantité
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Sinon, on l'ajoute comme nouveau
      return [...currentItems, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }];
    });
  };

  // RETIRER DU PANIER
  const removeItem = (id: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  // VIDER LE PANIER
  const clearCart = () => {
    setItems([]);
  };

  // CALCULS AUTOMATIQUES
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
};

// 3. Un petit Hook pour utiliser le panier facilement
export const useCart = () => useContext(CartContext);
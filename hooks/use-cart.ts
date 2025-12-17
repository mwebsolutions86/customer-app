import { create } from 'zustand';

// 1. Définition du type d'un article
export interface CartItem {
  cartId: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  options: any[];
}

// 2. L'Interface qui définit ce que contient le panier (Données + Actions)
interface CartState {
  items: CartItem[];
  
  // C'est cette ligne qui manquait et qui causait l'erreur TypeScript :
  addToCart: (product: any, quantity: number, options: any[]) => void;
  
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

// 3. L'Implémentation
export const useCart = create<CartState>((set, get) => ({
  items: [],

  addToCart: (product, quantity = 1, options = []) => {
    set((state) => {
      const cartId = `${product.id}-${JSON.stringify(options.sort())}`;
      const existingItemIndex = state.items.findIndex((item) => item.cartId === cartId);
      let updatedItems = [...state.items];

      if (existingItemIndex > -1) {
        updatedItems[existingItemIndex].quantity += quantity;
      } else {
        updatedItems.push({
          cartId,
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity,
          options
        });
      }
      return { items: updatedItems };
    });
  },

  removeFromCart: (cartId) => {
    set((state) => ({
      items: state.items.filter((item) => item.cartId !== cartId),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
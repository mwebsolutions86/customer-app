import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Définition complète d'un article panier (Support Options + Ingrédients)
export interface CartItem {
  cartId: string; // ID unique (Produit + Options + Ingrédients)
  id: string;
  name: string;
  price: number;       // Prix de base
  finalPrice: number;  // Prix avec options incluses
  quantity: number;
  image_url: string | null;
  selectedOptions: any[];      
  removedIngredients: string[]; 
}

interface CartState {
  items: CartItem[];
  addItem: (item: any) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (payload) => {
        set((state) => {
          // GÉNÉRATION D'UN ID UNIQUE "FOOD TECH"
          // Trie les options et ingrédients pour garantir que "Burger+Frites" == "Burger+Frites"
          const optionsStr = JSON.stringify(
              (payload.selectedOptions || []).sort((a: any, b: any) => (a.id || '').localeCompare(b.id || ''))
          );
          const ingredientsStr = JSON.stringify(
              (payload.removedIngredients || []).sort()
          );
          
          const cartId = `${payload.id}-${optionsStr}-${ingredientsStr}`;

          const existingItemIndex = state.items.findIndex((item) => item.cartId === cartId);
          let updatedItems = [...state.items];

          if (existingItemIndex > -1) {
            // Si exactement le même produit existe, on augmente la quantité
            updatedItems[existingItemIndex].quantity += payload.quantity;
          } else {
            // Sinon, on ajoute une nouvelle ligne
            updatedItems.push({
              cartId,
              id: payload.id,
              name: payload.name,
              price: payload.price,
              finalPrice: payload.finalPrice, 
              image_url: payload.image_url,
              quantity: payload.quantity,
              selectedOptions: payload.selectedOptions || [],
              removedIngredients: payload.removedIngredients || []
            });
          }
          return { items: updatedItems };
        });
      },

      removeItem: (cartId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartId !== cartId),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
      }
    }),
    {
      name: 'food-tech-cart-storage', // Nom unique pour le stockage
      storage: createJSONStorage(() => AsyncStorage), // Utilisation du stockage natif
    }
  )
);
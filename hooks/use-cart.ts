import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Définition complète d'un article panier (Mise à jour)
export interface CartItem {
  cartId: string; 
  id: string;
  name: string;
  price: number;       
  finalPrice: number;  
  quantity: number;
  image_url: string | null;
  selectedOptions: any[];      
  removedIngredients: string[];
  // 👇 Le champ manquant est ajouté ici
  selectedVariation?: { id: string; name: string; price: number } | null;
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
          // 1. Génération ID Unique "Food Tech"
          // On inclut la variante, les options et les ingrédients dans la clé unique
          const variationId = payload.selectedVariation ? payload.selectedVariation.id : 'base';
          
          const optionsStr = JSON.stringify(
              (payload.selectedOptions || []).sort((a: any, b: any) => (a.id || '').localeCompare(b.id || ''))
          );
          const ingredientsStr = JSON.stringify(
              (payload.removedIngredients || []).sort()
          );
          
          // ID = ID_Produit + ID_Variante + Options + Ingrédients
          const cartId = `${payload.id}-${variationId}-${optionsStr}-${ingredientsStr}`;

          const existingItemIndex = state.items.findIndex((item) => item.cartId === cartId);
          const updatedItems = [...state.items];

          if (existingItemIndex > -1) {
            // Produit identique trouvé : on incrémente la quantité
            updatedItems[existingItemIndex].quantity += payload.quantity;
          } else {
            // Nouveau produit : on l'ajoute
            updatedItems.push({
              cartId,
              id: payload.id,
              name: payload.name,
              price: payload.price,
              finalPrice: payload.finalPrice, 
              image_url: payload.image_url,
              quantity: payload.quantity,
              selectedOptions: payload.selectedOptions || [],
              removedIngredients: payload.removedIngredients || [],
              selectedVariation: payload.selectedVariation || null // ✅ On stocke la variante
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
      name: 'food-tech-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
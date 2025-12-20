import { create } from 'zustand';

// 1. Définition complète d'un article panier (Support Options + Ingrédients)
export interface CartItem {
  cartId: string; // ID unique (Produit + Options + Ingrédients)
  id: string;
  name: string;
  price: number;       // Prix de base
  finalPrice: number;  // Prix avec options incluses
  quantity: number;
  image_url: string | null;
  selectedOptions: any[];      // Renommé pour correspondre à la modale
  removedIngredients: string[]; // NOUVEAU : Gestion des "Sans oignons"
}

interface CartState {
  items: CartItem[];
  
  // On renomme 'addToCart' en 'addItem' pour matcher la modale
  // On accepte un objet complet "payload" au lieu de paramètres séparés
  addItem: (item: any) => void;
  
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  addItem: (payload) => {
    set((state) => {
      // GÉNÉRATION D'UN ID UNIQUE "FOOD TECH"
      // Un "Burger Sans Oignon" est différent d'un "Burger Normal"
      // On crée l'ID en combinant : ID Produit + Options triées + Ingrédients retirés triés
      
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
        // Si exactement le même produit existe (mêmes options/ingrédients), on augmente la quantité
        updatedItems[existingItemIndex].quantity += payload.quantity;
      } else {
        // Sinon, on ajoute une nouvelle ligne
        updatedItems.push({
          cartId,
          id: payload.id,
          name: payload.name,
          price: payload.price,
          finalPrice: payload.finalPrice, // Le prix calculé par la modale
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
    // On utilise finalPrice qui inclut déjà les suppléments
    return items.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
  }
}));
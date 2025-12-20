import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Assure-toi que ce chemin est bon chez toi

export type Store = {
  id: string;
  name: string;
  address: string;
  delivery_fees: number;
  image_url?: string;
  // 👇 Les champs manquants qu'on ajoute ici :
  primary_color?: string;
  secondary_color?: string;
  is_open?: boolean;
  logo_url?: string;
};

type StoreContextType = {
  currentStore: Store | null;
  setStore: (store: Store) => void;
  isLoading: boolean;
};

const StoreContext = createContext<StoreContextType>({
  currentStore: null,
  setStore: () => {},
  isLoading: false,
});

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour définir le magasin (sera appelée depuis l'écran de sélection)
  const setStore = (store: Store) => {
    setCurrentStore(store);
    // Ici, on pourrait aussi sauvegarder l'ID dans le AsyncStorage pour s'en souvenir au prochain lancement
  };

  return (
    <StoreContext.Provider value={{ currentStore, setStore, isLoading }}>
      {children}
    </StoreContext.Provider>
  );
};
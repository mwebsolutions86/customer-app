import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// --- TYPES MIS À JOUR ---
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  ingredients: string[];
  options_config: any[];
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface Store {
    id: string;
    name: string;
    description: string | null;
    delivery_fees: number;
    is_open: boolean;
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
}

export const useMenu = (storeId: string) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMenuData = useCallback(async () => {
    try {
      // 1. Récupérer TOUTES les infos du Store (Couleurs, Logo, etc.)
      const { data: storeData } = await supabase
          .from('stores')
          .select('*') // On prend tout
          .eq('id', storeId)
          .single();

      if (storeData) {
          // On force le typage pour correspondre à notre interface
          setStore(storeData as Store);

          // 2. Récupérer Catégories & Produits
          const { data: cats } = await supabase
          .from('categories')
          .select(`
              id, name, rank, image_url,
              products (
                id, name, description, price, image_url, ingredients, options_config, created_at
              )
          `)
          .eq('brand_id', storeData.brand_id) // Assure-toi que brand_id existe dans ta table stores
          .order('rank');

          if (cats) {
              const formattedCats = cats.map((cat: any) => ({
                  ...cat,
                  products: cat.products.sort((a: any, b: any) => 
                    a.name.localeCompare(b.name)
                  )
              }));
              setCategories(formattedCats);
          }
      }
    } catch (error) {
      console.error('Erreur chargement menu:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;

    fetchMenuData();

    // --- LE SECRET DU TEMPS RÉEL ---
    const channel = supabase
      .channel('public-updates')
      // A. Écoute les changements sur les PRODUITS
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchMenuData())
      // B. Écoute les changements sur les CATÉGORIES
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchMenuData())
      // C. Écoute les changements sur le STORE (Paramètres, Couleurs, Ouverture)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${storeId}` }, 
        (payload) => {
          console.log("🎨 Paramètres mis à jour !", payload.new);
          // Mise à jour immédiate du store local sans tout recharger
          setStore(prev => ({ ...prev, ...payload.new } as Store));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, fetchMenuData]);

  return { categories, store, loading };
};
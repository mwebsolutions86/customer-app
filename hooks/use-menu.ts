import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// --- TYPES MIS À JOUR (Synchronisés avec Admin) ---
export interface OptionItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  min: number; // NOUVEAU
  max: number; // NOUVEAU
  items: OptionItem[];
}

export interface Ingredient {
  id: string;
  name: string;
  is_available: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  ingredients: Ingredient[]; 
  option_groups: OptionGroup[];
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
      const { data: storeData } = await supabase.from('stores').select('*').eq('id', storeId).single();

      if (storeData) {
          setStore(storeData as Store);

          const { data: cats, error } = await supabase
          .from('categories')
          .select(`
              id, name, rank, image_url,
              products (
                id, name, description, price, image_url, created_at, is_available,
                product_option_links (
                  group: option_groups (
                    id, name, type, min_selection, max_selection,
                    items: option_items (id, name, price, is_available)
                  )
                ),
                product_ingredients (
                  ingredient: ingredients (id, name, is_available)
                )
              )
          `)
          .eq('brand_id', storeData.brand_id)
          .order('rank');

          if (error) throw error;

          if (cats) {
              const formattedCats = cats.map((cat: any) => ({
                  ...cat,
                  products: cat.products
                    .filter((p: any) => p.is_available !== false)
                    .map((prod: any) => ({
                        ...prod,
                        option_groups: prod.product_option_links?.map((link: any) => ({
                            ...link.group,
                            // MAPPING CRITIQUE : On transforme les noms DB vers Front
                            min: link.group?.min_selection || 0,
                            max: link.group?.max_selection || 1,
                            items: link.group?.items?.sort((a:any, b:any) => a.price - b.price) || []
                        })) || [],
                        ingredients: prod.product_ingredients?.map((link: any) => link.ingredient) || []
                    }))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
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
    const channel = supabase.channel('menu-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchMenuData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'option_groups' }, fetchMenuData) // Écouter les changements de règles
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId, fetchMenuData]);

  return { categories, store, loading };
};
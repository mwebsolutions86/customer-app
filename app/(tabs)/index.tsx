import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import { BRAND_ID } from '@/lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Types
type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCartStore();
  const router = useRouter();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id, name,
          products ( id, name, price, description, image_url, is_available )
        `)
        .eq('brand_id', BRAND_ID)
        .eq('products.is_available', true)
        .order('rank');

      if (error) throw error;
      
      // Filtrer les catégories vides
      const cleanData = data?.filter((c: any) => c.products.length > 0) || [];
      setCategories(cleanData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{item.price} DH</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => addItem({ id: item.id, name: item.name, price: item.price })}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="black" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Universal Eats 🍔</Text>
        {cartCount > 0 && (
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartBtn}>
            <Ionicons name="cart" size={24} color="white" />
            <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{item.name}</Text>
            {item.products.map((product) => (
                <View key={product.id}>{renderProduct({ item: product })}</View>
            ))}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      {/* FLOATING CART BUTTON */}
      {cartCount > 0 && (
          <TouchableOpacity style={styles.floatBtn} onPress={() => router.push('/cart')}>
              <Text style={styles.floatText}>Voir le Panier ({cartCount})</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  title: { fontSize: 22, fontWeight: 'bold' },
  cartBtn: { backgroundColor: 'black', padding: 10, borderRadius: 20 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 15, padding: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  image: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  name: { fontWeight: 'bold', fontSize: 16 },
  desc: { color: 'gray', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  price: { fontWeight: 'bold', fontSize: 16 },
  addButton: { backgroundColor: 'black', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  floatBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'black', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  floatText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useStore, Store } from '../context/StoreProvider';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectStoreScreen() {
  const { setStore } = useStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [brandName, setBrandName] = useState<string>('Chargement...'); // Pour stocker le nom de la marque
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoresAndBrand();
  }, []);

  const fetchStoresAndBrand = async () => {
    try {
      // On demande les stores ET le nom de la marque associée (jointure)
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          brands ( name )
        `)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        setStores(data);
        
        // On récupère le nom de la marque depuis le premier magasin trouvé
        // (Car tous les magasins affichés appartiennent à la même marque dans ton contexte actuel)
        // @ts-ignore : On ignore l'erreur TS temporaire sur la structure imbriquée
        const fetchedBrandName = data[0].brands?.name; 
        if (fetchedBrandName) {
          setBrandName(fetchedBrandName);
        } else {
            setBrandName("Notre Franchise");
        }
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      setBrandName("Restaurant");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = (store: Store) => {
    setStore(store);
    
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeLabel}>Bienvenue chez</Text>
        {/* Ici, on affiche le vrai nom de la Marque (ex: "Universal Eats" ou "Burger King") */}
        <Text style={styles.brandTitle}>{brandName}</Text>
        <Text style={styles.subtitle}>Choisissez votre point de vente</Text>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => handleSelectStore(item)}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 24 }}>🏪</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeAddress}>{item.address}</Text>
              <Text style={styles.deliveryFee}>
                Livraison : {item.delivery_fees ? Number(item.delivery_fees).toFixed(2) + 'DH' : 'Gratuite'}
              </Text>
            </View>
            <View style={styles.arrow}>
              <Text style={{ fontSize: 20, color: '#666' }}>→</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center', // Centrer le texte
  },
  welcomeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 28, // Plus gros pour la marque
    fontWeight: '800', // Très gras
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  deliveryFee: {
    fontSize: 12,
    color: '#00C853',
    fontWeight: '600',
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  arrow: {
    marginLeft: 8,
  },
});
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/hooks/use-cart';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CURRENT_STORE_ID } from '@/lib/constants';
import * as Location from 'expo-location';

export default function CheckoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { items, getTotalPrice, clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isCheckingZone, setIsCheckingZone] = useState(false);

  const cartTotal = getTotalPrice();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La géolocalisation est nécessaire pour la livraison.');
        return;
      }
      
      setIsCheckingZone(true);
      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        
        const { data, error } = await supabase.rpc('check_delivery_availability', {
          p_store_id: CURRENT_STORE_ID,
          p_lat: location.coords.latitude,
          p_lng: location.coords.longitude
        });

        if (error) throw error;

        if (data && data[0]?.is_available) {
          setDeliveryFee(data[0].delivery_fee);
        } else {
          Alert.alert('Hors zone', 'Désolé, nous ne livrons pas encore à cette position.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingZone(false);
      }
    })();
  }, []);

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !userLocation) return;

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const rpcItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        options: item.options || []
      }));

      const { error: rpcError } = await supabase.rpc('create_order_secure', {
        p_store_id: CURRENT_STORE_ID,
        p_items: rpcItems,
        p_delivery_address: "Adresse GPS Agadir",
        p_location: `POINT(${userLocation.coords.longitude} ${userLocation.coords.latitude})`
      });

      if (rpcError) throw rpcError;

      clearCart();
      Alert.alert('Succès', 'Votre commande est en préparation !', [{ text: 'OK', onPress: () => router.replace('/(tabs)/') }]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ textAlign: 'center', marginTop: 50 }}>Votre panier est vide.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>Finaliser la commande</ThemedText>

        <View style={styles.section}>
          <ThemedText type="subtitle">Résumé</ThemedText>
          <View style={styles.itemRow}>
            <ThemedText>Sous-total</ThemedText>
            <ThemedText>{cartTotal.toFixed(2)} DH</ThemedText>
          </View>
          <View style={styles.itemRow}>
            <ThemedText>Frais de livraison</ThemedText>
            {isCheckingZone ? <ActivityIndicator size="small" /> : <ThemedText>{deliveryFee.toFixed(2)} DH</ThemedText>}
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <ThemedText type="subtitle">Total</ThemedText>
            <ThemedText type="subtitle" style={{ color: themeColors.tint }}>{(cartTotal + deliveryFee).toFixed(2)} DH</ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.orderButton, { backgroundColor: themeColors.tint, opacity: (loading || isCheckingZone) ? 0.6 : 1 }]} 
          onPress={handlePlaceOrder}
          disabled={loading || isCheckingZone}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.orderButtonText}>Confirmer • {(cartTotal + deliveryFee).toFixed(2)} DH</ThemedText>}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: { marginBottom: 20 },
  section: { marginBottom: 30, backgroundColor: 'rgba(128,128,128,0.05)', padding: 15, borderRadius: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  orderButton: { padding: 18, borderRadius: 15, alignItems: 'center' },
  orderButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
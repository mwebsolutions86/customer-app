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
  
  // On récupère le panier complet
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
        
        // Appel RPC pour vérifier la zone (si votre backend le gère)
        const { data, error } = await supabase.rpc('check_delivery_availability', {
          p_store_id: CURRENT_STORE_ID,
          p_lat: location.coords.latitude,
          p_lng: location.coords.longitude
        });

        if (!error && data && data[0]?.is_available) {
          setDeliveryFee(data[0].delivery_fee);
        } else {
          // Fallback simple si le RPC n'existe pas encore ou erreur
          setDeliveryFee(10); // Frais par défaut
        }
      } catch (err) {
        console.log("Zone check skipped or failed", err);
        setDeliveryFee(10); // Fallback
      } finally {
        setIsCheckingZone(false);
      }
    })();
  }, []);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    
    // Sécurité: Si pas de loc, on demande une confirmation ou on bloque (ici on bloque pour l'exemple)
    if (!userLocation) {
        Alert.alert("Localisation requise", "Nous avons besoin de votre position pour livrer.");
        return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Veuillez vous connecter");

      // --- CONSTRUCTION DU PAQUET COMMANDE (LE FIX EST ICI) ---
      const rpcItems = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.finalPrice, // On envoie le prix calculé (base + options)
        // ON ENVOIE L'OBJET COMPLET POUR L'ADMIN PANEL
        options: {
            selectedOptions: item.selectedOptions || [],
            removedIngredients: item.removedIngredients || []
        }
      }));

      // On utilise l'insertion directe si le RPC 'create_order_secure' n'est pas à jour
      // C'est plus sûr pour tester immédiatement
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
            store_id: CURRENT_STORE_ID,
            user_id: user.id,
            total_amount: cartTotal + deliveryFee,
            delivery_fee_applied: deliveryFee,
            status: 'pending',
            order_type: 'delivery',
            payment_method: 'cash',
            payment_status: 'pending',
            delivery_address: "Position GPS", // Idéalement faire un Reverse Geocoding ici
            location: `POINT(${userLocation.coords.longitude} ${userLocation.coords.latitude})`,
            customer_name: user.user_metadata?.full_name || "Client App",
            customer_phone: user.user_metadata?.phone || ""
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Si l'insertion commande réussit, on insère les items
      // Note: Idéalement faire via RPC pour atomicité, mais ceci débloque la situation
      const { data: orderData } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (orderData) {
          const itemsToInsert = rpcItems.map(i => ({
              order_id: orderData.id,
              product_id: i.product_id,
              quantity: i.quantity,
              price: i.price,
              product_name: items.find(it => it.id === i.product_id)?.name || "Produit",
              options: i.options // Supabase va le convertir en JSONB automatiquement
          }));

          const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
          if (itemsError) throw itemsError;
      }

      clearCart();
      Alert.alert('Succès', 'Votre commande est en cuisine ! 👨‍🍳', [
          { text: 'Suivre ma commande', onPress: () => router.replace('/(tabs)/') }
      ]);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur', error.message || "Impossible de passer la commande");
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
          <ThemedText type="subtitle" style={{marginBottom:10}}>Récapitulatif</ThemedText>
          {items.map((item, idx) => (
              <View key={idx} style={{marginBottom:10}}>
                  <View style={styles.itemRow}>
                    <ThemedText style={{fontWeight:'bold'}}>{item.quantity}x {item.name}</ThemedText>
                    <ThemedText>{(item.finalPrice * item.quantity).toFixed(2)} DH</ThemedText>
                  </View>
                  {/* Affichage Debug pour être sûr */}
                  {item.selectedOptions?.map((opt:any, i:number) => (
                      <ThemedText key={i} style={{fontSize:12, color:'#666', marginLeft:20}}>+ {opt.name}</ThemedText>
                  ))}
                  {item.removedIngredients?.map((ing:string, i:number) => (
                      <ThemedText key={i} style={{fontSize:12, color:'red', marginLeft:20}}>- Sans {ing}</ThemedText>
                  ))}
              </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.itemRow}>
            <ThemedText>Sous-total</ThemedText>
            <ThemedText>{cartTotal.toFixed(2)} DH</ThemedText>
          </View>
          <View style={styles.itemRow}>
            <ThemedText>Livraison</ThemedText>
            {isCheckingZone ? <ActivityIndicator size="small" /> : <ThemedText>{deliveryFee.toFixed(2)} DH</ThemedText>}
          </View>
          
          <View style={[styles.divider, {backgroundColor: themeColors.text}]} />
          
          <View style={styles.totalRow}>
            <ThemedText type="subtitle">Total à payer</ThemedText>
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
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.orderButtonText}>Commander (Cash)</ThemedText>}
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
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop:5 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  orderButton: { padding: 18, borderRadius: 15, alignItems: 'center' },
  orderButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
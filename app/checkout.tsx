import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/hooks/use-cart';
import { supabase } from '@/lib/supabase';
import { error as logError } from '@/lib/logger';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Location from 'expo-location';
import { useStore } from '@/context/StoreProvider';

export default function CheckoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { currentStore } = useStore();
  
  const { items, getTotalPrice, clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isCheckingZone, setIsCheckingZone] = useState(false);

  const cartTotal = getTotalPrice();
  // ✅ Calcul du total final (Panier + Livraison) pour l'envoyer au backend
  const finalTotal = cartTotal + deliveryFee;
  
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La géolocalisation est nécessaire.');
        return;
      }
      setIsCheckingZone(true);
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        setDeliveryFee(10); // Simulation frais (À remplacer par votre logique de zone)
      } catch (err) {
        setDeliveryFee(10);
      } finally {
        setIsCheckingZone(false);
      }
    })();
  }, []);

  // ✅ HELPER: Regrouper les options pour l'affichage
  const renderGroupedOptions = (options: any[]) => {
    if (!options || options.length === 0) return null;
    const counts = options.reduce((acc: any, opt: any) => {
        const key = opt.id || opt.name;
        if (!acc[key]) acc[key] = { ...opt, count: 0 };
        acc[key].count += 1;
        return acc;
    }, {});

    return Object.values(counts).map((opt: any, i: number) => (
        <ThemedText key={i} style={{fontSize:12, color:'#666', marginLeft:20, marginTop: 2}}>
            + {opt.count > 1 ? `${opt.count}x ` : ''}{opt.name}
        </ThemedText>
    ));
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!userLocation) {
        Alert.alert("Localisation requise", "Nous avons besoin de votre position.");
        return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Veuillez vous connecter");

      // --- Construction Paquet Commande ---
      const rpcItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name, 
        quantity: item.quantity,
        unit_price: item.finalPrice, 
        total_price: item.finalPrice * item.quantity,
        
        // ✅ STRUCTURE JSON STRICTE POUR LE POS/ADMIN
        options: {
            variation: item.selectedVariation || null,        // Objet {id, name, price}
            options: item.selectedOptions || [],              // Array d'objets
            removed_ingredients: item.removedIngredients || [] // Array de strings
        }
      }));

      // Appel RPC
      if (!currentStore) {
        Alert.alert('Erreur', 'Store non sélectionné');
        return;
      }
      
      const { error } = await supabase.rpc('create_order_secure', {
            p_store_id: currentStore.id,
            p_customer_name: user.user_metadata?.full_name || "Client App",
            p_customer_phone: user.user_metadata?.phone || "",
            p_delivery_address: "Position GPS", 
            p_order_type: 'delivery',
            p_items: rpcItems,
            // 👇 AJOUT CRITIQUE : On envoie le total calculé pour l'affichage POS
            p_total_amount: finalTotal
      });

      if (error) throw error;

      clearCart();
      Alert.alert('Succès', 'Votre commande est en cuisine ! 👨‍🍳', [
          { text: 'Suivre ma commande', onPress: () => router.replace('/(tabs)/') }
      ]);

    } catch (error: any) {
      logError(error)
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>Finaliser la commande</ThemedText>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={{marginBottom:10}}>Récapitulatif</ThemedText>
          {items.map((item, idx) => (
              <View key={idx} style={{marginBottom:15}}>
                  <View style={styles.itemRow}>
                    <ThemedText style={{fontWeight:'bold'}}>{item.quantity}x {item.name}</ThemedText>
                    <ThemedText>{(item.finalPrice * item.quantity).toFixed(2)} DH</ThemedText>
                  </View>
                  
                  {/* Affichage Taille */}
                  {item.selectedVariation && (
                      <ThemedText style={{fontSize:12, color:'#666', marginLeft:20, fontStyle:'italic'}}>
                          Taille: {item.selectedVariation.name}
                      </ThemedText>
                  )}

                  {/* Affichage Options Groupées */}
                  {renderGroupedOptions(item.selectedOptions)}

                  {/* Affichage Ingrédients Retirés */}
                  {item.removedIngredients?.map((ing:string, i:number) => (
                      <ThemedText key={i} style={{fontSize:12, color:'#EF4444', marginLeft:20}}>
                          - Sans {ing}
                      </ThemedText>
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
            <ThemedText type="subtitle" style={{ color: themeColors.tint }}>{finalTotal.toFixed(2)} DH</ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.orderButton, { backgroundColor: themeColors.tint, opacity: (loading || isCheckingZone) ? 0.6 : 1 }]} 
          onPress={handlePlaceOrder}
          disabled={loading || isCheckingZone}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.orderButtonText}>Commander</ThemedText>}
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
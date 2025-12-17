import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useCart } from '@/hooks/use-cart';
import { useMenu } from '@/hooks/use-menu'; // Import du hook menu
import { supabase } from '@/lib/supabase';
import { CURRENT_STORE_ID, THEME_COLOR } from '@/lib/constants';
import { ArrowLeft, MapPin, Phone, User, Bike, ShoppingBag, Utensils } from 'lucide-react-native';

type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  
  // On récupère les infos du store pour avoir les frais de livraison
  const { store } = useMenu(CURRENT_STORE_ID);

  // États du formulaire
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('takeaway'); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirection si panier vide
  useEffect(() => {
    if (items.length === 0) {
        router.replace('/(tabs)/');
    }
  }, [items, router]);

  // CALCULS FINANCIERS
  const cartTotal = getTotalPrice();
  // Si livraison choisie, on prend les frais du store, sinon 0
  const deliveryFee = orderType === 'delivery' ? (store?.delivery_fees || 0) : 0;
  const finalTotal = cartTotal + deliveryFee;

  const handleOrder = async () => {
    // 1. Validation
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Champs manquants", "Merci d'indiquer votre nom et téléphone.");
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      Alert.alert("Adresse manquante", "Merci d'indiquer l'adresse de livraison.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Création de la commande
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: CURRENT_STORE_ID,
          total_amount: finalTotal, // On envoie le total AVEC frais
          delivery_fee_applied: deliveryFee, // On sauvegarde combien a coûté la livraison
          status: 'pending',
          customer_name: name,
          customer_phone: phone,
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? address : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Ajout des articles
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        options: item.options || []
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Succès + Incitation Fidélité
      clearCart();
      
      Alert.alert(
        "Commande Validée ! 🎉",
        `Merci ${name}, votre commande #${orderData.order_number} est en préparation.\n\n💡 Créez un compte la prochaine fois pour gagner des points !`,
        [{ text: "Compris", onPress: () => router.replace('/(tabs)/') }]
      );

    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText type="title">Finaliser</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          {/* Section 1 : Mode de commande */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={{ marginBottom: 12 }}>Mode de retrait</ThemedText>
            <View style={styles.typeSelector}>
                
                <TouchableOpacity 
                    style={[styles.typeOption, orderType === 'dine_in' && styles.typeOptionActive]}
                    onPress={() => setOrderType('dine_in')}
                >
                    <Utensils size={20} color={orderType === 'dine_in' ? THEME_COLOR : '#666'} />
                    <ThemedText style={orderType === 'dine_in' ? styles.typeTextActive : styles.typeText}>Sur place</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.typeOption, orderType === 'takeaway' && styles.typeOptionActive]}
                    onPress={() => setOrderType('takeaway')}
                >
                    <ShoppingBag size={20} color={orderType === 'takeaway' ? THEME_COLOR : '#666'} />
                    <ThemedText style={orderType === 'takeaway' ? styles.typeTextActive : styles.typeText}>Emporter</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.typeOption, orderType === 'delivery' && styles.typeOptionActive]}
                    onPress={() => setOrderType('delivery')}
                >
                    <Bike size={20} color={orderType === 'delivery' ? THEME_COLOR : '#666'} />
                    <ThemedText style={orderType === 'delivery' ? styles.typeTextActive : styles.typeText}>Livraison</ThemedText>
                </TouchableOpacity>
            </View>
          </View>

          {/* Section 2 : Coordonnées */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={{ marginBottom: 12 }}>Vos coordonnées</ThemedText>
            
            <View style={styles.inputGroup}>
                <User size={20} color="#999" style={styles.inputIcon} />
                <TextInput 
                    placeholder="Votre Nom"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                />
            </View>

            <View style={styles.inputGroup}>
                <Phone size={20} color="#999" style={styles.inputIcon} />
                <TextInput 
                    placeholder="Numéro de téléphone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    style={styles.input}
                />
            </View>

            {orderType === 'delivery' && (
                <View style={[styles.inputGroup, { alignItems: 'flex-start', paddingTop: 12 }]}>
                    <MapPin size={20} color="#999" style={styles.inputIcon} />
                    <TextInput 
                        placeholder="Adresse complète (Quartier, Rue...)"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                        style={[styles.input, { height: 80, paddingTop: 0 }]}
                    />
                </View>
            )}
          </View>

          {/* Section 3 : Résumé Financier */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={{ marginBottom: 12 }}>Résumé</ThemedText>
            
            <View style={styles.summaryRow}>
                <ThemedText>Sous-total</ThemedText>
                <ThemedText>{cartTotal.toFixed(2)} DH</ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
                <ThemedText>Frais de livraison</ThemedText>
                <ThemedText style={deliveryFee > 0 ? { color: '#000' } : { color: '#22c55e' }}>
                    {deliveryFee > 0 ? `${deliveryFee.toFixed(2)} DH` : 'Gratuit'}
                </ThemedText>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
                <ThemedText type="defaultSemiBold">Total à payer</ThemedText>
                <ThemedText type="title" style={{ color: THEME_COLOR }}>{finalTotal.toFixed(2)} DH</ThemedText>
            </View>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
            <TouchableOpacity 
                style={[styles.checkoutButton, { backgroundColor: THEME_COLOR, opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleOrder}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <ThemedText style={styles.checkoutText}>Confirmer la commande</ThemedText>
                )}
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  // Toggle Styles
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRadius: 10,
  },
  typeOptionActive: {
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  // Inputs
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  // Footer
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  checkoutButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  }
});
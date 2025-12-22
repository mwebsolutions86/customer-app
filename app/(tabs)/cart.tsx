import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../hooks/use-cart';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useMenu } from '../../hooks/use-menu';

// L'ID DU MAGASIN (Pour le MVP)
const STORE_ID = '73b158dd-4ff1-4294-9279-0f5d98f95480'; 

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, addItem, clearCart, getTotalPrice } = useCart();
  
  // On récupère les infos du store (y compris les frais de livraison)
  const { store } = useMenu(STORE_ID);
  const PRIMARY = store?.primary_color || '#000000';
  const SECONDARY = store?.secondary_color || '#FFFFFF';
  
  // Frais de livraison par défaut si non chargés (fallback)
  const STORE_DELIVERY_FEE = store?.delivery_fees || 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('delivery');

  // --- CALCULS FINANCIERS ---
  const cartTotal = getTotalPrice();
  const deliveryFee = orderType === 'delivery' ? STORE_DELIVERY_FEE : 0;
  const finalTotal = cartTotal + deliveryFee;

  useEffect(() => {
    const fetchUserInfo = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const { data: profile } = await supabase
                    .from('cust_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    if (profile.full_name) setCustomerName(profile.full_name);
                    if (profile.phone) setCustomerPhone(profile.phone);
                    if (profile.address) setDeliveryAddress(profile.address); 
                } 
            }
        } catch (err) {
            console.log("Info: Profil non chargé", err);
        }
    };

    fetchUserInfo();
  }, []);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;

    if (!customerName.trim()) {
        Alert.alert("Oups", "Merci d'indiquer votre nom.");
        return;
    }
    if (!customerPhone.trim()) {
        Alert.alert("Oups", "Merci d'indiquer votre téléphone.");
        return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
        Alert.alert("Adresse manquante", "Veuillez entrer une adresse de livraison.");
        return;
    }

    setIsSubmitting(true);

    try {
        const secureItems = items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            options: {
                selectedOptions: item.selectedOptions || [],
                removedIngredients: item.removedIngredients || []
            }
        }));

        // APPEL RPC SÉCURISÉ
        const { data, error } = await supabase.rpc('create_order_secure', {
            p_store_id: STORE_ID, 
            p_customer_name: customerName,
            p_customer_phone: customerPhone,
            p_delivery_address: orderType === 'delivery' ? deliveryAddress : '', 
            p_order_type: orderType,
            p_items: secureItems
        });

        if (error) throw error;

        const response = data as any;

        clearCart();
        Alert.alert(
            "Commande Validée ! 🚀", 
            `Votre commande N°${response.order_number} est confirmée.\nTotal à payer : ${response.total_amount} DH`
        );
        router.push('/');

    } catch (error: any) {
        console.error(error);
        Alert.alert("Erreur", "Impossible de valider la commande : " + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Votre panier est vide</Text>
        <TouchableOpacity onPress={() => router.push('/')} style={[styles.goBackButton, { backgroundColor: PRIMARY }]}>
            <Text style={[styles.goBackText, { color: SECONDARY }]}>Voir le Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Panier</Text>
            <TouchableOpacity onPress={clearCart}><Text style={{ color: '#EF4444', fontWeight: '600' }}>Vider</Text></TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
            
            <Text style={[styles.sectionTitle, { color: PRIMARY }]}>Type de commande</Text>
            
            <View style={styles.typeSelector}>
                {['dine_in', 'takeaway', 'delivery'].map((type) => {
                    const isActive = orderType === type;
                    let label = "Sur Place";
                    let icon = "restaurant";
                    if(type === 'takeaway') { label = "Emporter"; icon = "bag-handle"; }
                    if(type === 'delivery') { label = "Livraison"; icon = "bicycle"; }

                    return (
                        <TouchableOpacity 
                            key={type}
                            onPress={() => setOrderType(type as any)} 
                            style={[
                                styles.typeBtn, 
                                isActive && { backgroundColor: PRIMARY, borderColor: PRIMARY }
                            ]}
                        >
                            <Ionicons name={icon as any} size={20} color={isActive ? SECONDARY : 'black'} />
                            <Text style={[styles.typeText, isActive && { color: SECONDARY }]}>{label}</Text>
                        </TouchableOpacity>
                    )
                })}
            </View>

            <Text style={[styles.sectionTitle, {marginTop: 20, color: PRIMARY}]}>Articles</Text>
            
            {items.map((item) => (
                <View key={item.cartId} style={styles.cartItem}>
                    <Image source={item.image_url ? { uri: item.image_url } : { uri: 'https://via.placeholder.com/150' }} style={styles.itemImage} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, { color: PRIMARY }]}>{item.name}</Text>
                        <Text style={styles.itemPrice}>{item.finalPrice * item.quantity} DH</Text>
                        
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                                + {item.selectedOptions.map((o: any) => o.name).join(', ')}
                            </Text>
                        )}
                        {item.removedIngredients && item.removedIngredients.length > 0 && (
                            <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>
                                Sans : {item.removedIngredients.join(', ')}
                            </Text>
                        )}
                    </View>
                    <View style={styles.quantityControl}>
                        <TouchableOpacity onPress={() => removeItem(item.cartId)} style={styles.qtyBtn}>
                            <Ionicons name="remove" size={16}/>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => addItem({ ...item, quantity: 1 })} style={[styles.qtyBtn, {backgroundColor: PRIMARY}]}>
                            <Ionicons name="add" size={16} color={SECONDARY}/>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: PRIMARY }]}>Vos Coordonnées</Text>
                
                <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#666" style={{marginRight: 10}} />
                    <TextInput placeholder="Nom complet" style={styles.input} value={customerName} onChangeText={setCustomerName} />
                </View>

                <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#666" style={{marginRight: 10}} />
                    <TextInput placeholder="Téléphone" style={styles.input} keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />
                </View>
                
                {orderType === 'delivery' && (
                    <View style={[styles.inputWrapper, { alignItems: 'flex-start' }]}>
                        <Ionicons name="location-outline" size={20} color="#666" style={{marginRight: 10, marginTop: 12}} />
                        <TextInput 
                            placeholder="Adresse de livraison complète..." 
                            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]} 
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                )}

                <View style={[styles.inputWrapper, { alignItems: 'flex-start', marginTop: 5 }]}>
                    <Ionicons name="create-outline" size={20} color="#666" style={{marginRight: 10, marginTop: 12}} />
                    <TextInput 
                        placeholder="Instructions spéciales..." 
                        style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]} 
                        value={orderNote}
                        onChangeText={setOrderNote}
                        multiline
                        numberOfLines={3}
                    />
                </View>
            </View>

        </ScrollView>
        </KeyboardAvoidingView>

        {/* --- FOOTER AMÉLIORÉ --- */}
        <View style={styles.footer}>
            <View style={{ marginBottom: 16 }}>
                {/* Ligne Sous-total */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontSize: 16, color: '#666' }}>Sous-total</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{cartTotal.toFixed(2)} DH</Text>
                </View>
                
                {/* Ligne Livraison (Conditionnelle) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, color: '#666' }}>Livraison</Text>
                    {orderType === 'delivery' ? (
                         <Text style={{ fontSize: 16, fontWeight: '600' }}>{deliveryFee.toFixed(2)} DH</Text>
                    ) : (
                         <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#16A34A', backgroundColor: '#DCFCE7', paddingHorizontal: 6, borderRadius: 4 }}>OFFERTE</Text>
                    )}
                </View>

                {/* Ligne Total Final */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111' }}>Total</Text>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: PRIMARY }}>{finalTotal.toFixed(2)} <Text style={{fontSize: 14, color: '#111'}}>DH</Text></Text>
                </View>
            </View>
            
            <TouchableOpacity 
                style={[styles.checkoutButton, { backgroundColor: PRIMARY }]} 
                onPress={handleSubmitOrder} 
                disabled={isSubmitting}
            >
                {isSubmitting ? <ActivityIndicator color={SECONDARY} /> : <Text style={[styles.checkoutText, {color: SECONDARY}]}>Valider la commande</Text>}
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F2F2F7' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', gap: 20 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#666' },
    goBackButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
    goBackText: { fontWeight: 'bold' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: '900' },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 }, 
    typeSelector: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
    typeText: { fontWeight: '600', fontSize: 13 },
    cartItem: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 20, marginBottom: 12, gap: 12, alignItems: 'center' },
    itemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#eee' },
    itemName: { fontWeight: 'bold', fontSize: 16 }, 
    itemPrice: { fontWeight: '600', color: '#666', marginTop: 2 },
    quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3F4F6', padding: 6, borderRadius: 12 },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    qtyText: { fontWeight: 'bold', fontSize: 14, minWidth: 10, textAlign: 'center' },
    formSection: { marginTop: 20, backgroundColor: 'white', padding: 20, borderRadius: 24 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, marginBottom: 12 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 30, shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 },
    checkoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 20 },
    checkoutText: { fontSize: 18, fontWeight: 'bold' }
});
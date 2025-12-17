import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../hooks/use-cart';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

// L'ID DU MAGASIN
const STORE_ID = '73b158dd-4ff1-4294-9279-0f5d98f95480'; 

export default function CartScreen() {
  const router = useRouter();
  const { items, removeFromCart, addToCart, clearCart, getTotalPrice } = useCart();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États du formulaire
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(''); // ✅ NOUVEAU
  
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');

  const total = getTotalPrice();

  // CHARGEMENT AUTO DES INFOS
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
                    // Si tu as ajouté la colonne address dans cust_profiles, tu peux la charger ici :
                    if (profile.address) setDeliveryAddress(profile.address); 
                } 
                else if (user.user_metadata) {
                    if (user.user_metadata.full_name) setCustomerName(user.user_metadata.full_name);
                    if (user.user_metadata.phone) setCustomerPhone(user.user_metadata.phone);
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

    // VALIDATION
    if (!customerName.trim()) {
        Alert.alert("Oups", "Merci d'indiquer votre nom.");
        return;
    }
    if (!customerPhone.trim()) {
        Alert.alert("Oups", "Merci d'indiquer votre téléphone.");
        return;
    }
    // ✅ Validation Adresse
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
        Alert.alert("Adresse manquante", "Veuillez entrer une adresse de livraison.");
        return;
    }

    setIsSubmitting(true);

    try {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: Math.floor(1000 + Math.random() * 9000),
                customer_name: customerName,
                customer_phone: customerPhone,
                
                // ✅ ENVOI DE L'ADRESSE (Uniquement si livraison)
                delivery_address: orderType === 'delivery' ? deliveryAddress : null,
                
                total_amount: total,
                status: 'pending',
                order_type: orderType,
                store_id: STORE_ID,
                brand_id: 'f1d00cdb-e946-4b3d-983a-eb00428cd8ff',
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            options: item.options
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        clearCart();
        Alert.alert("Commande Envoyée ! 🚀", `Votre commande N°${order.order_number} est en cuisine.`);
        router.push('/');

    } catch (error: any) {
        console.error(error);
        Alert.alert("Erreur", error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Votre panier est vide</Text>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.goBackButton}><Text style={styles.goBackText}>Voir le Menu</Text></TouchableOpacity>
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

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.sectionTitle}>Type de commande</Text>
            <View style={styles.typeSelector}>
                <TouchableOpacity onPress={() => setOrderType('dine_in')} style={[styles.typeBtn, orderType === 'dine_in' && styles.typeBtnActive]}>
                    <Ionicons name="restaurant" size={20} color={orderType === 'dine_in' ? 'white' : 'black'} />
                    <Text style={[styles.typeText, orderType === 'dine_in' && styles.typeTextActive]}>Sur Place</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOrderType('takeaway')} style={[styles.typeBtn, orderType === 'takeaway' && styles.typeBtnActive]}>
                    <Ionicons name="bag-handle" size={20} color={orderType === 'takeaway' ? 'white' : 'black'} />
                    <Text style={[styles.typeText, orderType === 'takeaway' && styles.typeTextActive]}>Emporter</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOrderType('delivery')} style={[styles.typeBtn, orderType === 'delivery' && styles.typeBtnActive]}>
                    <Ionicons name="bicycle" size={20} color={orderType === 'delivery' ? 'white' : 'black'} />
                    <Text style={[styles.typeText, orderType === 'delivery' && styles.typeTextActive]}>Livraison</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, {marginTop: 20}]}>Articles</Text>
            {items.map((item) => (
                <View key={item.cartId} style={styles.cartItem}>
                    <Image source={item.image_url ? { uri: item.image_url } : { uri: 'https://via.placeholder.com/150' }} style={styles.itemImage} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>{item.price * item.quantity} DH</Text>
                        {item.options && item.options.length > 0 && (
                            <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                                {item.options.join(', ')}
                            </Text>
                        )}
                    </View>
                    <View style={styles.quantityControl}>
                        <TouchableOpacity onPress={() => removeFromCart(item.cartId)} style={styles.qtyBtn}><Ionicons name="remove" size={16}/></TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => addToCart({ ...item }, 1, item.options)} style={[styles.qtyBtn, {backgroundColor: 'black'}]}><Ionicons name="add" size={16} color="white"/></TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Vos Coordonnées</Text>
                
                <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#666" style={{marginRight: 10}} />
                    <TextInput placeholder="Nom complet" style={styles.input} value={customerName} onChangeText={setCustomerName} />
                </View>

                <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#666" style={{marginRight: 10}} />
                    <TextInput placeholder="Téléphone" style={styles.input} keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />
                </View>
                
                {/* ✅ CHAMP ADRESSE CONDITIONNEL */}
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
            </View>

        </ScrollView>

        <View style={styles.footer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, color: '#666' }}>Total</Text>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#111' }}>{total} <Text style={{fontSize: 14}}>DH</Text></Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleSubmitOrder} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.checkoutText}>Valider la commande</Text>}
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
    goBackButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'black', borderRadius: 30 },
    goBackText: { color: 'white', fontWeight: 'bold' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: '900' },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10, color: '#333' },
    typeSelector: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
    typeBtnActive: { backgroundColor: 'black', borderColor: 'black' },
    typeText: { fontWeight: '600', fontSize: 13 },
    typeTextActive: { color: 'white' },
    cartItem: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 20, marginBottom: 12, gap: 12, alignItems: 'center' },
    itemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#eee' },
    itemName: { fontWeight: 'bold', fontSize: 16, color: '#111' },
    itemPrice: { fontWeight: '600', color: '#666', marginTop: 2 },
    quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3F4F6', padding: 6, borderRadius: 12 },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    qtyText: { fontWeight: 'bold', fontSize: 14, minWidth: 10, textAlign: 'center' },
    
    formSection: { marginTop: 20, backgroundColor: 'white', padding: 20, borderRadius: 24 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, marginBottom: 12 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 30, shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 },
    checkoutButton: { backgroundColor: 'black', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 20 },
    checkoutText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
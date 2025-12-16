import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { useCartStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { STORE_ID } from '@/lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const { items, removeItem, clearCart, total } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const DELIVERY_FEE = 15;
  const finalTotal = total() + DELIVERY_FEE;

  const submitOrder = async () => {
    if (!name || !phone || !address) {
      Alert.alert("Champs manquants", "Merci de remplir toutes les infos.");
      return;
    }

    setLoading(true);
    try {
      // 1. Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: STORE_ID,
          status: 'NEW',
          total_amount: finalTotal,
          delivery_fee: DELIVERY_FEE,
          delivery_address: address,
          payment_method: 'CASH',
          guest_info: { name, phone }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Créer les lignes
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Succès
      clearCart();
      Alert.alert("Succès ! 🍔", "Votre commande est envoyée en cuisine.", [
        { text: "Super", onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Problème lors de la commande.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return (
    <View style={styles.center}>
        <Text>Votre panier est vide 🤷‍♂️</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}><Text style={{color: 'blue'}}>Retour au menu</Text></TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <Text style={styles.title}>Votre Panier</Text>
        <View style={{width: 24}} />
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
            <View style={styles.item}>
                <Text style={styles.qty}>x{item.quantity}</Text>
                <View style={{flex: 1, marginHorizontal: 10}}>
                    <Text style={{fontWeight: 'bold'}}>{item.name}</Text>
                    <Text style={{color: 'gray'}}>{item.price * item.quantity} DH</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
            </View>
        )}
        ListFooterComponent={
            <View style={styles.form}>
                <Text style={styles.sectionTitle}>Infos Livraison</Text>
                <TextInput placeholder="Votre Nom" style={styles.input} value={name} onChangeText={setName} />
                <TextInput placeholder="Téléphone" style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                <TextInput placeholder="Adresse Complète" style={[styles.input, {height: 80}]} multiline value={address} onChangeText={setAddress} />
                
                <View style={styles.summary}>
                    <View style={styles.row}><Text>Sous-total</Text><Text>{total()} DH</Text></View>
                    <View style={styles.row}><Text>Livraison</Text><Text>{DELIVERY_FEE} DH</Text></View>
                    <View style={[styles.row, {marginTop: 10}]}><Text style={styles.total}>Total</Text><Text style={styles.total}>{finalTotal} DH</Text></View>
                </View>

                <TouchableOpacity 
                    style={[styles.btn, loading && {opacity: 0.7}]} 
                    onPress={submitOrder}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>{loading ? 'Envoi...' : `Commander (${finalTotal} DH)`}</Text>
                </TouchableOpacity>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  item: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  qty: { fontWeight: 'bold', backgroundColor: '#eee', padding: 5, borderRadius: 5 },
  form: { padding: 20 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 10, marginTop: 20 },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  summary: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  total: { fontWeight: 'bold', fontSize: 18 },
  btn: { backgroundColor: 'black', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
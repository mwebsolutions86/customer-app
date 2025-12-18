import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMenu } from '../../hooks/use-menu'; // 1. Import du hook
import { ActivityIndicator, View } from 'react-native';

// ⚠️ TON ID STORE
const STORE_ID = '73b158dd-4ff1-4294-9279-0f5d98f95480'; 

export default function TabLayout() {
  // 2. Récupération de la couleur
  const { store, loading } = useMenu(STORE_ID);
  const PRIMARY = store?.primary_color || '#000000';

  // Petit chargement pour éviter le flash noir
  if (loading) return <View style={{flex:1, backgroundColor:'white'}} />;

  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: PRIMARY, // 3. Application de la couleur dynamique
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 5 }
      }}
    >
      
      {/* 1. MENU */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Menu',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={24} color={color} />,
        }}
      />

      {/* 2. PANIER */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />,
        }}
      />

      {/* 3. FIDÉLITÉ (Optionnel, tu peux laisser tel quel ou adapter) */}
      <Tabs.Screen
        name="loyalty"
        options={{
          title: 'Fidélité',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "gift" : "gift-outline"} size={24} color={color} />,
        }}
      />

      {/* 4. COMPTE (Correspond au fichier account.tsx ou profile.tsx selon ton nommage) */}
      <Tabs.Screen
        name="account" 
        options={{
          title: 'Compte',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
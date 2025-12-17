import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'black' }}>
      
      {/* 1. L'ONGLET MENU (Doit correspondre au fichier index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Menu',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} />,
        }}
      />

      {/* 2. PANIER */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />,
        }}
      />

      {/* 3. FIDÉLITÉ */}
      <Tabs.Screen
        name="loyalty"
        options={{
          title: 'Fidélité',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="gift" size={24} color={color} />,
        }}
      />

      {/* 4. COMPTE */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
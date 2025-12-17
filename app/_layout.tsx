import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import AuthScreen from './auth'; // On importe notre nouvel écran
import { ThemeProvider } from '../context/ThemeContext'; // Importe ton nouveau fichier




export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // 1. Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Écouter les changements (Connexion / Déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Écran de chargement initial
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // SI PAS CONNECTÉ -> AFFICHER AUTH SCREEN
  if (!session) {
    return <AuthScreen />;
  }

  // SI CONNECTÉ -> AFFICHER L'APPLICATION NORMALE (Les Tabs)
  return (
    // On enveloppe tout le Stack dans le ThemeProvider
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import AuthScreen from './auth';
import SelectStoreScreen from './select-store'; // On importe notre nouvel écran
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreProvider, useStore } from '../context/StoreProvider'; // On importe useStore aussi

// 1. On crée un composant interne qui a accès au Contexte
function AppContent({ session }: { session: Session | null }) {
  const { currentStore, isLoading } = useStore();

  // Si le chargement du store n'est pas fini
  if (isLoading) {
     return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // LOGIQUE PRINCIPALE DE NAVIGATION

  // Always render a single Stack navigator and control the initial route
  const initialRoute = !session ? 'auth' : !currentStore ? 'select-store' : '(tabs)';

  return (
    <Stack initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="select-store" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

// 2. Le Layout Principal qui enveloppe tout avec les Providers
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <StoreProvider>
        {/* On passe la session à notre composant de contenu */}
        <AppContent session={session} />
      </StoreProvider>
    </ThemeProvider>
  );
}
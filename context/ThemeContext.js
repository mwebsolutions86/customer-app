import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityIndicator, View } from 'react-native';

// Couleurs par défaut (fallback si pas d'internet ou chargement)
const defaultTheme = {
  primaryColor: '#FFC107', // Jaune par défaut
  secondaryColor: '#000000',
  logoUrl: null,
  name: 'Loading...',
  loading: true,
};

const ThemeContext = createContext(defaultTheme);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        // On récupère la config du PREMIER magasin trouvé
        const { data, error } = await supabase
          .from('stores')
          .select('primary_color, secondary_color, logo_url, name')
          .limit(1)
          .single();

        if (data && !error) {
          setTheme({
            primaryColor: data.primary_color || '#FFC107',
            secondaryColor: data.secondary_color || '#000000',
            logoUrl: data.logo_url,
            name: data.name,
            loading: false,
          });
        } else {
          // Si erreur, on garde les defaults mais on arrête le chargement
          setTheme(prev => ({ ...prev, loading: false }));
        }
      } catch (e) {
        // use logger
        const { warn } = require('../lib/logger')
        warn('Erreur chargement thème:', e)
        setTheme(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTheme();
  }, []);

  // Optionnel : Écran de chargement (Splash screen étendu)
  // Si vous voulez que l'app attende d'avoir les couleurs avant d'afficher quoi que ce soit
  if (theme.loading) {
     return (
       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
         <ActivityIndicator size="large" color="#FFC107" />
       </View>
     );
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personnalisé pour utiliser les couleurs facilement partout
export const useAppTheme = () => useContext(ThemeContext);
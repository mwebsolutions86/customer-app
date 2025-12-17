// context/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

// 1. Définition des couleurs
const lightColors = {
  background: '#f8f9fa',
  text: '#000000',
  card: '#ffffff',
  border: '#f0f0f0',
  subText: '#666666',
  tint: '#007AFF'
};

const darkColors = {
  background: '#1c1c1e',
  text: '#ffffff',
  card: '#2c2c2e',
  border: '#3a3a3c',
  subText: '#aaaaaa',
  tint: '#0A84FF'
};

// 2. Création du contexte
const ThemeContext = createContext();

// 3. Le "Fournisseur" (Provider) qui va envelopper l'app
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false); // Par défaut en clair

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Un petit raccourci (Hook) pour utiliser le thème partout
export const useTheme = () => useContext(ThemeContext);
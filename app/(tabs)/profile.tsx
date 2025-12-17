// app/(tabs)/profile.tsx
import React from 'react'; // Plus besoin de useState ici !
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext'; // <--- L'IMPORT MAGIQUE

export default function ProfileScreen() {
  // On récupère les infos globales
  const { isDark, toggleTheme, theme } = useTheme(); 

  // Variable locale juste pour la 2FA (qui reste un réglage perso)
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* EN-TÊTE */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.tint }]}>
            <Text style={styles.avatarText}>JD</Text> 
          </View>
          <Text style={[styles.name, { color: theme.text }]}>John Doe</Text>
          <Text style={[styles.email, { color: theme.subText }]}>john.doe@email.com</Text>
        </View>

        {/* SECTION PRÉFÉRENCES */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>PRÉFÉRENCES</Text>
          
          {/* Switch Dark Mode GLOBAL */}
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <Text style={[styles.rowText, { color: theme.text }]}>Mode Sombre</Text>
            <Switch 
              value={isDark}            // Vient du contexte global
              onValueChange={toggleTheme} // Change le contexte global
              trackColor={{ false: "#767577", true: theme.tint }}
            />
          </View>

          {/* Switch 2FA */}
          <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
            <Text style={[styles.rowText, { color: theme.text }]}>Double Authentification</Text>
            <Switch 
              value={isTwoFactorEnabled}
              onValueChange={setIsTwoFactorEnabled}
              trackColor={{ false: "#767577", true: "#34C759" }}
            />
          </View>
        </View>

        {/* SECTION NAVIGATION */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <Text style={[styles.rowText, { color: theme.text }]}>Modifier mes informations</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', padding: 30, marginBottom: 20 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  email: { fontSize: 14 },
  section: { marginBottom: 20, marginHorizontal: 16, borderRadius: 10, overflow: 'hidden' },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginLeft: 15, marginTop: 15, marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  rowText: { fontSize: 16 },
});
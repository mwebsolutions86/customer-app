import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useMenu } from '../../hooks/use-menu'; // Import du hook branding

const STORE_ID = '73b158dd-4ff1-4294-9279-0f5d98f95480'; 

export default function AccountScreen() {
  const router = useRouter();
  const { store } = useMenu(STORE_ID);
  const PRIMARY = store?.primary_color || '#000000';
  const SECONDARY = store?.secondary_color || '#FFFFFF';

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Charger les infos utilisateur
  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
            const { data } = await supabase.from('cust_profiles').select('*').eq('id', user.id).single();
            setProfile(data);
        }
        setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in'); // Redirige vers la connexion
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={PRIMARY} /></View>;

  return (
    <View style={styles.container}>
        {/* EN-TÊTE AVEC COULEUR DYNAMIQUE */}
        <View style={[styles.header, { backgroundColor: PRIMARY }]}>
            <SafeAreaView edges={['top']}>
                <View style={styles.headerContent}>
                    <View style={[styles.avatarContainer, { borderColor: SECONDARY }]}>
                         {/* Initiale ou image */}
                        <Text style={[styles.avatarText, { color: PRIMARY }]}>
                            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text style={[styles.name, { color: SECONDARY }]}>{profile?.full_name || 'Utilisateur'}</Text>
                        <Text style={[styles.email, { color: SECONDARY, opacity: 0.8 }]}>{user?.email}</Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MON COMPTE</Text>
                
                <TouchableOpacity style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: PRIMARY + '20' }]}>
                        <Ionicons name="receipt-outline" size={20} color={PRIMARY} />
                    </View>
                    <Text style={styles.rowText}>Mes commandes</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: PRIMARY + '20' }]}>
                        <Ionicons name="location-outline" size={20} color={PRIMARY} />
                    </View>
                    <Text style={styles.rowText}>Mes adresses</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>INFORMATIONS</Text>
                
                <TouchableOpacity style={styles.row}>
                    <View style={[styles.iconBox, { backgroundColor: PRIMARY + '20' }]}>
                        <Ionicons name="information-circle-outline" size={20} color={PRIMARY} />
                    </View>
                    <Text style={styles.rowText}>À propos du restaurant</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.row} onPress={handleSignOut}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.rowText, { color: '#EF4444' }]}>Se déconnecter</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 15 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  avatarText: { fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold' },
  email: { fontSize: 14 },
  
  content: { padding: 20 },
  section: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 15, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },
});
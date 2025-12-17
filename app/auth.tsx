import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Champs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAuth = async () => {
    if(!email || !password) return Alert.alert("Erreur", "Email et mot de passe requis.");
    
    setLoading(true);
    try {
        if (isSignUp) {
            if(!fullName) return Alert.alert("Erreur", "Merci d'entrer votre nom.");
            
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone
                    }
                }
            });
            if (error) throw error;
            Alert.alert("Bienvenue ! 🚀", "Compte créé avec succès. Vous êtes connecté.");
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        }
    } catch (error: any) {
        Alert.alert("Erreur", error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.blob, { backgroundColor: '#FFC107', top: -100, left: -100, opacity: 0.2 }]} />
      <View style={[styles.blob, { backgroundColor: '#4F46E5', bottom: -100, right: -100, opacity: 0.15 }]} />

      <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={styles.iconContainer}>
                <Ionicons name="fast-food" size={40} color="black" />
            </View>
            <Text style={styles.title}>Universal Eats</Text>
            <Text style={styles.subtitle}>{isSignUp ? "Créer un compte client" : "Bon retour parmi nous"}</Text>
        </View>

        <View style={styles.glassForm}>
            <View style={styles.toggleContainer}>
                <TouchableOpacity onPress={() => setIsSignUp(false)} style={[styles.toggleBtn, !isSignUp && styles.toggleBtnActive]}>
                    <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Connexion</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsSignUp(true)} style={[styles.toggleBtn, isSignUp && styles.toggleBtnActive]}>
                    <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>Inscription</Text>
                </TouchableOpacity>
            </View>

            {isSignUp && (
                <>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#666" style={{marginRight: 10}} />
                        <TextInput placeholder="Nom complet" style={styles.input} value={fullName} onChangeText={setFullName} />
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#666" style={{marginRight: 10}} />
                        <TextInput placeholder="Téléphone (Optionnel)" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
                    </View>
                </>
            )}

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={{marginRight: 10}} />
                <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={{marginRight: 10}} />
                <TextInput placeholder="Mot de passe" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <TouchableOpacity style={styles.mainButton} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text style={styles.mainButtonText}>{isSignUp ? "S'inscrire" : "Se connecter"}</Text>
                )}
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  blob: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width, transform: [{ scale: 1.5 }] },
  iconContainer: { width: 80, height: 80, backgroundColor: 'white', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 5, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#111' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  glassForm: { backgroundColor: 'rgba(255,255,255,0.7)', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 16, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  toggleText: { fontWeight: '600', color: '#666' },
  toggleTextActive: { color: 'black', fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  input: { flex: 1, fontSize: 16 },
  mainButton: { backgroundColor: 'black', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  mainButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
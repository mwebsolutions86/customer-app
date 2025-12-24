import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// On utilise les types génériques ou on les définit ici pour l'instant
interface Variation { id: string; name: string; price: number; }
interface OptionGroup { id: string; name: string; min: number; max: number; items: any[]; }

export default function ProductDetailsModal({ product, visible, onClose, onAddToCart }: any) {
  const insets = useSafeAreaInsets();
  
  // States
  const [quantity, setQuantity] = useState(1);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any[]>>({});
  
  const [loading, setLoading] = useState(true);

  // Reset à l'ouverture
  useEffect(() => {
    if (visible && product) {
      setQuantity(1);
      setSelectedOptions({});
      setVariations([]);
      setSelectedVariation(null);
      fetchProductDetails();
    }
  }, [visible, product]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // 1. Charger les Variantes (Si le produit est variable)
      if (product.type === 'variable') {
        const { data: vars } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', product.id)
          .order('price', { ascending: true });
        
        if (vars && vars.length > 0) {
          setVariations(vars);
          setSelectedVariation(vars[0]); // Sélectionner le premier (le moins cher) par défaut
        }
      }

      // 2. Charger les Options (Logic existante)
      // Note: Assurez-vous que votre DB a bien les données, sinon cette partie peut rester vide
      // Ici je simplifie pour l'exemple, mais vous garderez votre logique de chargement d'options
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calcul du prix total dynamique
  const getPrice = () => {
    let base = product.price;
    
    // Si variante sélectionnée, on prend son prix à la place du prix produit
    if (selectedVariation) {
      base = selectedVariation.price;
    }

    // Ajouter prix des options (si implémenté)
    // ...

    return base * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart({
      product,
      quantity,
      variation: selectedVariation, // On passe la variante au panier
      options: selectedOptions,
      finalPrice: getPrice()
    });
    onClose();
  };

  if (!visible || !product) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        
        {/* Zone transparente pour fermer en cliquant en haut */}
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

        <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          
          {/* Image Header */}
          <View style={styles.imageContainer}>
             {product.image_url ? (
                <Image source={{ uri: product.image_url }} style={styles.image} />
             ) : (
                <View style={[styles.image, { backgroundColor: '#eee', alignItems:'center', justifyContent:'center' }]}>
                   <Ionicons name="fast-food" size={50} color="#ccc"/>
                </View>
             )}
             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
               <Ionicons name="close" size={20} color="black" />
             </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{product.name}</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#000"/>
            ) : (
              <>
                {/* --- SÉLECTEUR DE TAILLE (VARIANTE) --- */}
                {variations.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choisissez votre taille</Text>
                    <View style={styles.variationContainer}>
                      {variations.map((v) => (
                        <TouchableOpacity 
                          key={v.id} 
                          onPress={() => setSelectedVariation(v)}
                          style={[
                            styles.variationCard, 
                            selectedVariation?.id === v.id && styles.variationCardSelected
                          ]}
                        >
                          <Text style={[
                            styles.variationText, 
                            selectedVariation?.id === v.id && styles.variationTextSelected
                          ]}>
                            {v.name}
                          </Text>
                          <Text style={[
                            styles.variationPrice,
                            selectedVariation?.id === v.id && styles.variationTextSelected
                          ]}>
                            {v.price} DH
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* --- OPTIONS (Placeholder pour la suite) --- */}
                {/* Vous pourrez réintégrer la boucle des options ici */}

              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
             <View style={styles.quantityControl}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                   <Ionicons name="remove" size={20}/>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                   <Ionicons name="add" size={20}/>
                </TouchableOpacity>
             </View>

             <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                <Text style={styles.addToCartText}>Ajouter • {getPrice().toFixed(2)} DH</Text>
             </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  content: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', overflow: 'hidden' },
  imageContainer: { height: 200, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  closeButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'white', padding: 8, borderRadius: 20, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:4 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', color:'#333' },
  
  variationContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  variationCard: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9', alignItems: 'center' },
  variationCardSelected: { borderColor: '#000', backgroundColor: '#000' },
  variationText: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#333' },
  variationPrice: { fontSize: 12, color: '#666' },
  variationTextSelected: { color: 'white' },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', gap: 16, alignItems: 'center' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4 },
  qtyBtn: { padding: 12 },
  qtyText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8 },
  addToCartBtn: { flex: 1, backgroundColor: '#000', padding: 16, borderRadius: 16, alignItems: 'center' },
  addToCartText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
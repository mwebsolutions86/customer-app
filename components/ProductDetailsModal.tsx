import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product, Variation, OptionGroup, OptionItem, Ingredient } from '@/hooks/use-menu';

interface ProductDetailsModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onAddToCart: (payload: any) => void;
}

export default function ProductDetailsModal({ product, visible, onClose, onAddToCart }: ProductDetailsModalProps) {
  const insets = useSafeAreaInsets();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, OptionItem[]>>({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);

  // Initialisation à l'ouverture
  useEffect(() => {
    if (visible && product) {
      setQuantity(1);
      setSelectedOptions({});
      setRemovedIngredients([]);
      
      // Auto-sélection taille par défaut
      if (product.variations && product.variations.length > 0) {
        setSelectedVariation(product.variations[0]);
      } else {
        setSelectedVariation(null);
      }
    }
  }, [visible, product]);

  // --- LOGIQUE PRIX ---
  const getUnitPrice = () => {
    if (!product) return 0;
    let base = selectedVariation ? selectedVariation.price : product.price;
    const optionsTotal = Object.values(selectedOptions).flat().reduce((acc, opt) => acc + opt.price, 0);
    return base + optionsTotal;
  };

  // --- LOGIQUE OPTIONS ---
  const handleOptionSelect = (group: OptionGroup, item: OptionItem) => {
    setSelectedOptions(prev => {
      const current = prev[group.id] || [];
      const isSelected = current.find(i => i.id === item.id);

      // Mode Radio (Choix unique)
      if (group.max === 1) {
        // Si déjà sélectionné et min=0, on désélectionne (optionnel)
        // Sinon on remplace
        return { ...prev, [group.id]: [item] };
      }

      // Mode Checkbox/Stepper (Choix multiple)
      if (isSelected) {
        // Retirer
        return { ...prev, [group.id]: current.filter(i => i.id !== item.id) };
      } else {
        // Ajouter (si max non atteint)
        if (group.max > 0 && current.length >= group.max) return prev;
        return { ...prev, [group.id]: [...current, item] };
      }
    });
  };

  // --- LOGIQUE INGRÉDIENTS ---
  const toggleIngredient = (name: string) => {
    setRemovedIngredients(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  // --- VALIDATION & AJOUT ---
  const handleAddToCart = () => {
    if (!product) return;

    // Validation Min options
    for (const group of product.option_groups || []) {
      const count = (selectedOptions[group.id] || []).length;
      if (count < group.min) {
        alert(`Veuillez choisir au moins ${group.min} option(s) pour "${group.name}"`);
        return;
      }
    }

    const finalPrice = getUnitPrice();
    const flatOptions = Object.values(selectedOptions).flat(); // ✅ Aplatir pour le panier

    onAddToCart({
      product,
      quantity,
      selectedVariation,      // ✅ Objet Variante complet
      selectedOptions: flatOptions, // ✅ Tableau d'options simple
      removedIngredients,     // ✅ Tableau de strings
      finalPrice              // ✅ Prix unitaire calculé
    });
    onClose();
  };

  if (!visible || !product) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

        <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          {/* HEADER IMAGE */}
          <View style={styles.imageContainer}>
             {product.image_url ? (
               <Image source={{ uri: product.image_url }} style={styles.image} />
             ) : (
               <View style={[styles.image, { backgroundColor: '#eee', justifyContent:'center', alignItems:'center' }]}>
                 <Ionicons name="fast-food" size={50} color="#ccc" />
               </View>
             )}
             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
               <Ionicons name="close" size={20} color="black" />
             </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.description}>{product.description}</Text>

            {/* 1. TAILLES (Variantes) */}
            {product.variations && product.variations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Taille</Text>
                <View style={styles.rowWrap}>
                  {product.variations.map(v => (
                    <TouchableOpacity 
                      key={v.id} 
                      onPress={() => setSelectedVariation(v)}
                      style={[styles.chip, selectedVariation?.id === v.id && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selectedVariation?.id === v.id && styles.chipTextSelected]}>
                        {v.name} • {v.price} DH
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 2. INGRÉDIENTS (Retrait) */}
            {product.ingredients && product.ingredients.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingrédients (Retirer)</Text>
                <View style={styles.rowWrap}>
                  {product.ingredients.map(ing => {
                    const isRemoved = removedIngredients.includes(ing.name);
                    return (
                      <TouchableOpacity 
                        key={ing.id} 
                        onPress={() => toggleIngredient(ing.name)}
                        style={[styles.chip, isRemoved ? styles.chipRemoved : styles.chipIncluded]}
                      >
                        <Ionicons name={isRemoved ? "close-circle" : "checkmark-circle"} size={16} color={isRemoved ? "#DC2626" : "#16A34A"} />
                        <Text style={[styles.chipText, isRemoved ? {color:'#DC2626', textDecorationLine:'line-through'} : {color:'#16A34A'}]}>
                          {ing.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. OPTIONS (Suppléments) */}
            {product.option_groups?.map(group => (
              <View key={group.id} style={styles.section}>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                    <Text style={styles.sectionTitle}>{group.name}</Text>
                    {group.max > 1 && <Text style={{fontSize:10, color:'#666'}}>Choix multiple (max {group.max})</Text>}
                </View>
                
                <View style={styles.rowWrap}>
                  {group.items.map(item => {
                    const isSelected = (selectedOptions[group.id] || []).some(i => i.id === item.id);
                    return (
                      <TouchableOpacity 
                        key={item.id} 
                        onPress={() => handleOptionSelect(group, item)}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item.name}</Text>
                        <Text style={[styles.optionPrice, isSelected && styles.optionTextSelected]}>+{item.price} DH</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
             <View style={styles.qtyContainer}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                   <Ionicons name="remove" size={20}/>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                   <Ionicons name="add" size={20}/>
                </TouchableOpacity>
             </View>

             <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
                <Text style={styles.addButtonText}>
                  Ajouter • {(getUnitPrice() * quantity).toFixed(2)} DH
                </Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  content: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', overflow: 'hidden' },
  imageContainer: { height: 200, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  closeButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'white', padding: 8, borderRadius: 20, shadowColor:'#000', shadowOpacity:0.1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color:'#111' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal:14, paddingVertical:8, borderRadius:30, borderWidth:1, borderColor:'#eee', backgroundColor:'#fff', flexDirection:'row', alignItems:'center', gap:6 },
  chipSelected: { backgroundColor:'#000', borderColor:'#000' },
  chipIncluded: { backgroundColor:'#F0FDF4', borderColor:'#DCFCE7' },
  chipRemoved: { backgroundColor:'#FEF2F2', borderColor:'#FEE2E2' },
  chipText: { fontSize:13, fontWeight:'600', color:'#333' },
  chipTextSelected: { color:'white' },
  optionCard: { width:'48%', padding:12, borderRadius:12, borderWidth:1, borderColor:'#eee', backgroundColor:'#FAFAFA' },
  optionCardSelected: { backgroundColor:'#000', borderColor:'#000' },
  optionText: { fontSize:13, fontWeight:'600', color:'#333' },
  optionPrice: { fontSize:12, color:'#666', marginTop:4 },
  optionTextSelected: { color:'white' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', gap: 16, alignItems: 'center' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  qtyBtn: { padding: 12 },
  qtyText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8 },
  addButton: { flex: 1, backgroundColor: '#000', padding: 16, borderRadius: 16, alignItems: 'center' },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
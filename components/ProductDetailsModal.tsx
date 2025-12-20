import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';
import { useCart } from '@/hooks/use-cart';
import * as Haptics from 'expo-haptics';

export default function ProductDetailsModal({ visible, product, onClose }: any) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  // --- NOUVEAUX ÉTATS POUR LA NOUVELLE LOGIQUE ---
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  
  // Reset quand le produit change
  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setSelectedOptions({});
      setRemovedIngredients([]);
    }
  }, [visible, product]);

  if (!product) return null;

  // --- LOGIQUE DE SÉLECTION ---
  const handleOptionSelect = (group: any, item: any) => {
    Haptics.selectionAsync();
    
    setSelectedOptions(prev => {
      const currentSelection = prev[group.id] || [];
      
      if (group.type === 'single') {
        // Radio : On remplace tout par le nouveau
        return { ...prev, [group.id]: [item] };
      } else {
        // Checkbox : On ajoute ou on enlève
        const exists = currentSelection.find((i: any) => i.id === item.id);
        let newSelection;
        if (exists) {
            newSelection = currentSelection.filter((i: any) => i.id !== item.id);
        } else {
            newSelection = [...currentSelection, item];
        }
        return { ...prev, [group.id]: newSelection };
      }
    });
  };

  const toggleIngredient = (ingId: string) => {
      Haptics.selectionAsync();
      setRemovedIngredients(prev => 
        prev.includes(ingId) ? prev.filter(id => id !== ingId) : [...prev, ingId]
      );
  };

  // --- CALCUL DU PRIX TOTAL ---
  const calculateTotal = () => {
    let total = product.price;
    
    // Ajout des options payantes
    Object.values(selectedOptions).flat().forEach((opt: any) => {
        total += (opt.price || 0);
    });

    return total * quantity;
  };

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // On prépare les options pour le panier
    const flatOptions = Object.values(selectedOptions).flat();
    
    addItem({
      ...product,
      quantity,
      selectedOptions: flatOptions,
      removedIngredients, // On passe aussi ce qu'on a retiré
      finalPrice: calculateTotal() / quantity // Prix unitaire final
    });
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      
      <View style={styles.container}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="fast-food" size={50} color="#ccc" />
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Info Base */}
          <View style={styles.header}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>{product.price} DH</Text>
          </View>
          <Text style={styles.description}>{product.description}</Text>

          {/* --- SECTION INGRÉDIENTS (NOUVEAU) --- */}
          {product.ingredients && product.ingredients.length > 0 && (
              <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ingrédients</Text>
                  <Text style={styles.sectionSubtitle}>Décochez pour retirer</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {product.ingredients.map((ing: any) => {
                          const isRemoved = removedIngredients.includes(ing.id);
                          return (
                              <TouchableOpacity 
                                key={ing.id} 
                                onPress={() => toggleIngredient(ing.id)}
                                style={[
                                    styles.ingChip, 
                                    isRemoved && styles.ingChipRemoved
                                ]}
                              >
                                  <Text style={[styles.ingText, isRemoved && styles.ingTextRemoved]}>
                                      {isRemoved ? 'Sans ' : ''}{ing.name}
                                  </Text>
                                  {isRemoved && <Ionicons name="close-circle" size={16} color="red" style={{marginLeft: 4}}/>}
                              </TouchableOpacity>
                          )
                      })}
                  </View>
              </View>
          )}

          {/* --- SECTION OPTIONS (NOUVEAU) --- */}
          {product.option_groups && product.option_groups.map((group: any) => (
            <View key={group.id} style={styles.section}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                  <Text style={styles.sectionTitle}>{group.name}</Text>
                  <Text style={styles.badge}>{group.type === 'single' ? 'Obligatoire' : 'Au choix'}</Text>
              </View>
              
              {group.items.map((item: any) => {
                const isSelected = selectedOptions[group.id]?.some((i: any) => i.id === item.id);
                
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => handleOptionSelect(group, item)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons 
                            name={group.type === 'single' 
                                ? (isSelected ? "radio-button-on" : "radio-button-off")
                                : (isSelected ? "checkbox" : "square-outline")
                            } 
                            size={20} 
                            color={isSelected ? Colors.light.tint : '#ccc'} 
                        />
                        <Text style={[styles.optionText, isSelected && {fontWeight:'bold', color: Colors.light.tint}]}>
                            {item.name}
                        </Text>
                    </View>
                    <Text style={styles.optionPrice}>+{item.price} DH</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
              <Ionicons name="remove" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
              <Ionicons name="add" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Text style={styles.addButtonText}>Ajouter • {calculateTotal()} DH</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  imageContainer: { height: 250, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  closeButton: { position: 'absolute', top: 20, right: 20, backgroundColor: '#fff', padding: 8, borderRadius: 20 },
  content: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900' },
  price: { fontSize: 20, fontWeight: 'bold', color: Colors.light.tint },
  description: { color: '#666', lineHeight: 20, marginBottom: 20 },
  
  section: { marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#999', marginBottom: 10 },
  badge: { fontSize: 10, fontWeight:'bold', backgroundColor:'#f0f0f0', paddingHorizontal:6, paddingVertical:2, borderRadius:4, overflow:'hidden', color:'#666'},

  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  optionRowSelected: { backgroundColor: '#f9f9ff', paddingHorizontal: 4, borderRadius: 8, borderColor: Colors.light.tint, borderWidth: 0.5 },
  optionText: { fontSize: 16, color: '#333' },
  optionPrice: { fontWeight: 'bold', color: '#666' },

  ingChip: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#c8e6c9' },
  ingChipRemoved: { backgroundColor: '#ffebee', borderColor: '#ffcdd2', flexDirection:'row', alignItems:'center' },
  ingText: { color: '#2e7d32', fontWeight: '600' },
  ingTextRemoved: { color: '#c62828', textDecorationLine: 'line-through' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', gap: 15, paddingBottom: 40 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4 },
  qtyBtn: { padding: 12 },
  qtyText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 10 },
  addButton: { flex: 1, backgroundColor: '#000', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
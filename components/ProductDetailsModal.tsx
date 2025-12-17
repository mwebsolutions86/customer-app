import { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'; // Platform retiré
import { ThemedText } from './themed-text';
import { X, Check, Plus, Minus } from 'lucide-react-native';
import { THEME_COLOR } from '@/lib/constants';

interface OptionConfig {
  name: string;
  price: number;
}

interface ProductDetailsModalProps {
  visible: boolean;
  product: any;
  onClose: () => void;
  onAddToCart: (product: any, options: string[], finalPrice: number) => void;
}

export function ProductDetailsModal({ visible, product, onClose, onAddToCart }: ProductDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<OptionConfig[]>([]);
  
  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setExcludedIngredients([]);
      setSelectedExtras([]);
    }
  }, [visible, product]);

  if (!product) return null;

  const basePrice = product.price;
  const extrasPrice = selectedExtras.reduce((acc, extra) => acc + extra.price, 0);
  const unitPrice = basePrice + extrasPrice;
  const totalPrice = unitPrice * quantity;

  const toggleIngredient = (ing: string) => {
    if (excludedIngredients.includes(ing)) {
      setExcludedIngredients(excludedIngredients.filter(i => i !== ing));
    } else {
      setExcludedIngredients([...excludedIngredients, ing]);
    }
  };

  const toggleExtra = (option: OptionConfig) => {
    const exists = selectedExtras.find(e => e.name === option.name);
    if (exists) {
      setSelectedExtras(selectedExtras.filter(e => e.name !== option.name));
    } else {
      setSelectedExtras([...selectedExtras, option]);
    }
  };

  const handleConfirm = () => {
    const finalOptions = [
      ...excludedIngredients.map(ing => `Sans ${ing}`),
      ...selectedExtras.map(ex => ex.price > 0 ? `${ex.name} (+${ex.price} DH)` : ex.name)
    ];

    for (let i = 0; i < quantity; i++) {
        onAddToCart(product, finalOptions, unitPrice);
    }
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Image 
                source={{ uri: product.image_url || 'https://via.placeholder.com/300' }} 
                style={styles.image} 
            />
            
            <View style={styles.content}>
                <ThemedText type="title" style={styles.title}>{product.name}</ThemedText>
                <ThemedText style={styles.price}>{basePrice} DH</ThemedText>
                <ThemedText style={styles.description}>{product.description}</ThemedText>

                <View style={styles.divider} />

                {product.ingredients && product.ingredients.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>Ingrédients</ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>Tapez pour enlever 👇</ThemedText>
                        
                        <View style={styles.chipsContainer}>
                            {product.ingredients.map((ing: string, i: number) => {
                                const isExcluded = excludedIngredients.includes(ing);
                                return (
                                    <TouchableOpacity 
                                        key={i} 
                                        style={[
                                            styles.chip, 
                                            isExcluded && styles.chipExcluded
                                        ]}
                                        onPress={() => toggleIngredient(ing)}
                                        activeOpacity={0.8}
                                    >
                                        {isExcluded ? (
                                            <X size={14} color="#999" style={{ marginRight: 4 }} />
                                        ) : (
                                            <Check size={14} color={THEME_COLOR} style={{ marginRight: 4 }} />
                                        )}
                                        <ThemedText style={[
                                            styles.chipText, 
                                            isExcluded && styles.chipTextExcluded
                                        ]}>
                                            {ing}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {product.options_config && product.options_config.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>Personnaliser</ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>Envie d&apos;un petit plus ? 😋</ThemedText>
                        
                        {product.options_config.map((option: OptionConfig, i: number) => {
                             const isSelected = selectedExtras.some(e => e.name === option.name);
                             return (
                                <TouchableOpacity 
                                    key={i} 
                                    style={[styles.extraRow, isSelected && styles.extraRowSelected]}
                                    onPress={() => toggleExtra(option)}
                                >
                                    <View style={{flex: 1}}>
                                        <ThemedText style={styles.extraName}>{option.name}</ThemedText>
                                        <ThemedText style={styles.extraPrice}>
                                            {option.price > 0 ? `+${option.price} DH` : 'Gratuit'}
                                        </ThemedText>
                                    </View>
                                    <View style={[styles.checkbox, isSelected && { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR }]}>
                                        {isSelected && <Check size={16} color="white" />}
                                    </View>
                                </TouchableOpacity>
                             );
                        })}
                    </View>
                )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
             <View style={styles.qtyContainer}>
                <TouchableOpacity onPress={() => quantity > 1 && setQuantity(q => q - 1)} style={styles.qtyBtn}>
                    <Minus size={20} color="#000" />
                </TouchableOpacity>
                <ThemedText type="title" style={{ width: 30, textAlign: 'center' }}>{quantity}</ThemedText>
                <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
                    <Plus size={20} color="#000" />
                </TouchableOpacity>
             </View>

             <TouchableOpacity style={[styles.addButton, { backgroundColor: THEME_COLOR }]} onPress={handleConfirm}>
                <ThemedText style={styles.addButtonText}>
                    Ajouter {totalPrice} DH
                </ThemedText>
             </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    height: '90%', 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLOR,
    marginBottom: 12,
  },
  description: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipExcluded: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    opacity: 0.6,
  },
  chipText: {
    fontWeight: '600',
    color: '#333',
  },
  chipTextExcluded: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  extraRowSelected: {
    backgroundColor: '#fffbeb', 
  },
  extraName: {
    fontSize: 15,
    fontWeight: '500',
  },
  extraPrice: {
    fontSize: 13,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 20,
    paddingBottom: 30, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    gap: 10,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar, StyleSheet, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMenu } from '../../hooks/use-menu';
import { useCart } from '../../hooks/use-cart';
import { useRouter } from 'expo-router';


// ⚠️ TON ID STORE
const STORE_ID = '73b158dd-4ff1-4294-9279-0f5d98f95480'; 
const { width } = Dimensions.get('window');

export default function MenuScreen() {
   
  const { categories, store, loading } = useMenu(STORE_ID);
  const { addToCart, items } = useCart();
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // --- GESTION MODALE ---
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [tempQty, setTempQty] = useState(1);
  
  // Options payantes (Suppléments)
  const [currentOptions, setCurrentOptions] = useState<any[]>([]); 
  
  // Ingrédients à EXCLURE (Nouveau !)
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);

  const cartItemCount = items ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;
  const PRIMARY = store?.primary_color || '#000000';
  const SECONDARY = store?.secondary_color || '#FFFFFF';
  const activeCategory = selectedCategory || (categories.length > 0 ? categories[0].id : null);

  const openProductDetail = (product: any) => {
    setSelectedProduct(product);
    setTempQty(1);
    setCurrentOptions([]); 
    setExcludedIngredients([]); // On remet à zéro les exclusions
  };

  // Gestion des Options Payantes
  const toggleOption = (option: any) => {
    const exists = currentOptions.find(opt => opt.name === option.name);
    if (exists) {
        setCurrentOptions(currentOptions.filter(opt => opt.name !== option.name));
    } else {
        setCurrentOptions([...currentOptions, option]);
    }
  };

  // Gestion des Ingrédients (Exclure/Inclure)
  const toggleIngredient = (ingredient: string) => {
    if (excludedIngredients.includes(ingredient)) {
        // On le remet (on retire de la liste des exclus)
        setExcludedIngredients(excludedIngredients.filter(ing => ing !== ingredient));
    } else {
        // On l'exclut (on ajoute à la liste des exclus)
        setExcludedIngredients([...excludedIngredients, ingredient]);
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const optionsPrice = currentOptions.reduce((acc, opt) => acc + (opt.price || 0), 0);
    return (selectedProduct.price + optionsPrice) * tempQty;
  };

  const confirmAddToCart = () => {
    if (selectedProduct) {
        // 1. Formater les options payantes
        const formattedOptions = currentOptions.map(opt => `${opt.name} (+${opt.price} DH)`);
        
        // 2. Formater les exclusions (C'est ici que ça se passe !)
        const formattedExclusions = excludedIngredients.map(ing => `🚫 Sans ${ing}`);

        // 3. Fusionner le tout pour le panier
        const allNotes = [...formattedOptions, ...formattedExclusions];

        const unitPrice = selectedProduct.price + currentOptions.reduce((acc, opt) => acc + (opt.price || 0), 0);
        const productToSend = { ...selectedProduct, price: unitPrice };

        addToCart(productToSend, tempQty, allNotes); 
        setSelectedProduct(null); 
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View>;
  if (!store) return <View style={styles.center}><Text>Restaurant indisponible</Text></View>;

  return (
    
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.blob, { backgroundColor: PRIMARY, top: -100, left: -100, opacity: 0.15 }]} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.headerGlass}>
            <View style={styles.headerTopRow}>
                <View style={styles.logoWrapper}>
                    {store.logo_url ? <Image source={{ uri: store.logo_url }} style={styles.logo} /> : <View style={[styles.logo, {backgroundColor: PRIMARY}]} />}
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.statusDot, { backgroundColor: store.is_open ? '#22C55E' : '#EF4444' }]} />
                        <Text style={styles.storeDesc}>{store.is_open ? 'Ouvert' : 'Fermé'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartButton}>
                    <Ionicons name="bag-handle-outline" size={22} color="black" />
                    {cartItemCount > 0 && <View style={[styles.badge, { backgroundColor: PRIMARY }]}><Text style={styles.badgeText}>{cartItemCount}</Text></View>}
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 16 }}>
                {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)} style={[styles.categoryPill, isActive && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}>
                            <Text style={[styles.categoryText, isActive && { color: SECONDARY }]}>{cat.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>

        {/* CONTENU */}
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {categories.map((category) => {
                if (activeCategory && category.id !== activeCategory) return null;
                return (
                    <View key={category.id} style={{ marginBottom: 30 }}>
                        <Text style={styles.sectionTitle}>{category.name}</Text>
                        {category.products.map((product) => (
                            <TouchableOpacity key={product.id} style={styles.card} activeOpacity={0.9} onPress={() => openProductDetail(product)}>
                                <Image source={product.image_url ? { uri: product.image_url } : { uri: 'https://via.placeholder.com/150' }} style={styles.cardImage} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                                    <Text style={styles.priceText}>{product.price} DH</Text>
                                </View>
                                <View style={[styles.addButton, { backgroundColor: store.is_open ? 'black' : '#ccc' }]}>
                                    <Ionicons name="add" size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            })}
        </ScrollView>
      </SafeAreaView>

      {/* --- MODALE DÉTAIL --- */}
      <Modal visible={!!selectedProduct} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                {selectedProduct && (
                    <>
                        <View style={styles.modalImageContainer}>
                            <Image source={selectedProduct.image_url ? { uri: selectedProduct.image_url } : { uri: 'https://via.placeholder.com/300' }} style={styles.modalImage} />
                            <TouchableOpacity onPress={() => setSelectedProduct(null)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 180 }}>
                            <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                            <Text style={styles.modalPrice}>{selectedProduct.price} DH</Text>
                            <Text style={styles.modalDesc}>{selectedProduct.description || "Aucune description disponible."}</Text>
                            
                            {/* --- SECTION INGRÉDIENTS À EXCLURE --- */}
                            {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                    <Text style={styles.sectionHeader}>Ingrédients <Text style={{fontSize: 14, fontWeight: 'normal', color: '#666'}}>(Touchez pour retirer)</Text></Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                        {selectedProduct.ingredients.map((ing: string, i: number) => {
                                            const isExcluded = excludedIngredients.includes(ing);
                                            return (
                                                <TouchableOpacity 
                                                    key={i} 
                                                    onPress={() => toggleIngredient(ing)}
                                                    style={[
                                                        styles.ingredientTag, 
                                                        isExcluded ? styles.ingredientExcluded : styles.ingredientIncluded
                                                    ]}
                                                >
                                                    {isExcluded ? (
                                                        <Ionicons name="close-circle" size={16} color="#EF4444" style={{marginRight: 4}} />
                                                    ) : (
                                                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{marginRight: 4}} />
                                                    )}
                                                    <Text style={[
                                                        styles.ingredientText, 
                                                        isExcluded && styles.ingredientTextExcluded
                                                    ]}>
                                                        {ing}
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* --- SECTION OPTIONS PAYANTES --- */}
                            {selectedProduct.options_config && selectedProduct.options_config.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                    <Text style={styles.sectionHeader}>Options & Suppléments</Text>
                                    {selectedProduct.options_config.map((option: any, index: number) => {
                                        const isSelected = currentOptions.some(opt => opt.name === option.name);
                                        return (
                                            <TouchableOpacity 
                                                key={index} 
                                                onPress={() => toggleOption(option)}
                                                style={[styles.optionRow, isSelected && { backgroundColor: '#F3F4F6', borderColor: PRIMARY }]}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.optionName, isSelected && { fontWeight: 'bold', color: 'black' }]}>{option.name}</Text>
                                                    <Text style={styles.optionPrice}>+{option.price} DH</Text>
                                                </View>
                                                <View style={[styles.checkbox, isSelected && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}>
                                                    {isSelected && <Ionicons name="checkmark" size={14} color={SECONDARY} />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.modalFooter}>
                            <View style={styles.qtyControl}>
                                <TouchableOpacity onPress={() => setTempQty(Math.max(1, tempQty - 1))} style={styles.qtyBtn}><Ionicons name="remove" size={20}/></TouchableOpacity>
                                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{tempQty}</Text>
                                <TouchableOpacity onPress={() => setTempQty(tempQty + 1)} style={styles.qtyBtn}><Ionicons name="add" size={20}/></TouchableOpacity>
                            </View>
                            <TouchableOpacity 
                                onPress={confirmAddToCart} 
                                style={[styles.confirmButton, { backgroundColor: store.is_open ? PRIMARY : '#ccc' }]}
                                disabled={!store.is_open}
                            >
                                <Text style={{ color: SECONDARY, fontWeight: 'bold', fontSize: 16 }}>
                                    Ajouter {calculateTotal().toFixed(2)} DH
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F2F2F7' },
    blob: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width, transform: [{ scale: 1.5 }] },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerGlass: { backgroundColor: 'rgba(255,255,255,0.8)', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingTop: 10, shadowColor: "#000", shadowOpacity: 0.05, elevation: 5 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
    logoWrapper: { shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 },
    logo: { width: 50, height: 50, borderRadius: 16, borderWidth: 2, borderColor: 'white' },
    storeName: { fontSize: 20, fontWeight: '900', color: '#111' },
    storeDesc: { fontSize: 12, color: '#666' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    cartButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.1 },
    badge: { position: 'absolute', top: -2, right: -2, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    badgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
    categoryPill: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.6)' },
    categoryText: { fontWeight: '700', fontSize: 13, color: '#666' },
    sectionTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 16 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 16, shadowOpacity: 0.05, shadowOffset: {width:0, height:5} },
    cardImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#eee' },
    productName: { fontWeight: '800', fontSize: 16, color: '#111' },
    productDesc: { color: '#666', fontSize: 12, marginVertical: 4 },
    priceText: { fontWeight: '700', fontSize: 14, color: '#111' },
    addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 12, bottom: 12 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '95%', overflow: 'hidden' },
    modalImageContainer: { height: 250, width: '100%', position: 'relative' },
    modalImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    closeButton: { position: 'absolute', top: 20, right: 20, backgroundColor: 'white', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.2 },
    modalTitle: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 5 },
    modalPrice: { fontSize: 22, fontWeight: '700', color: '#444', marginBottom: 15 },
    modalDesc: { fontSize: 16, color: '#666', lineHeight: 24 },
    sectionHeader: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#333' },
    
    // INGREDIENTS STYLES
    ingredientTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 5 },
    ingredientIncluded: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
    ingredientExcluded: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    ingredientText: { fontSize: 14, fontWeight: '600' },
    ingredientTextExcluded: { color: '#991B1B', textDecorationLine: 'line-through' },

    optionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
    optionName: { fontSize: 15, fontWeight: '500', color: '#333' },
    optionPrice: { fontSize: 13, color: '#666', marginTop: 2 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },

    modalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0f0f0', flexDirection: 'row', gap: 15, alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:-5}, shadowOpacity: 0.05, elevation: 10 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#F3F4F6', padding: 10, borderRadius: 16 },
    qtyBtn: { padding: 5 },
    confirmButton: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }
});
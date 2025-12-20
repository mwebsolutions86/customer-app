import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar, StyleSheet, Dimensions, Modal, Alert } from 'react-native';
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
  const addItem = useCart((state) => state.addItem);
  const items = useCart((state) => state.items);
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // --- GESTION MODALE ---
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [tempQty, setTempQty] = useState(1);
  const [currentOptions, setCurrentOptions] = useState<any[]>([]); 
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);

  const cartItemCount = items ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;
  const PRIMARY = store?.primary_color || '#000000';
  const SECONDARY = store?.secondary_color || '#FFFFFF';

  const displayedCategories = selectedCategory 
    ? categories.filter(c => c.id === selectedCategory) 
    : categories;

  const openProductDetail = (product: any) => {
    setSelectedProduct(product);
    setTempQty(1);
    setCurrentOptions([]); 
    setExcludedIngredients([]);
  };

  // --- LOGIQUE PUISSANTE : GESTION MIN/MAX ---
  const toggleOption = (group: any, item: any) => {
    // 1. On compte combien d'options sont déjà sélectionnées DANS CE GROUPE
    const selectedInGroup = currentOptions.filter(opt => group.items.find((i:any) => i.id === opt.id));
    const isAlreadySelected = selectedInGroup.some(opt => opt.id === item.id);

    if (isAlreadySelected) {
        // Désélection (toujours autorisé sauf logique stricte, ici on autorise)
        setCurrentOptions(currentOptions.filter(opt => opt.id !== item.id));
    } else {
        // Sélection
        if (group.max === 1) {
            // Cas Radio (Max 1) : On remplace l'ancienne sélection du groupe
            const otherGroupsOptions = currentOptions.filter(opt => !group.items.find((i:any) => i.id === opt.id));
            setCurrentOptions([...otherGroupsOptions, item]);
        } else {
            // Cas Checkbox (Max > 1) : On vérifie si on dépasse le Max
            if (selectedInGroup.length < group.max) {
                setCurrentOptions([...currentOptions, item]);
            } else {
                // Feedback visuel ou vibration possible ici (Max atteint)
                alert(`Maximum ${group.max} choix pour ${group.name}`);
            }
        }
    }
  };

  // VALIDATION AVANT AJOUT PANIER
  const validateAndAdd = () => {
      if (!selectedProduct) return;

      // Vérification des MINIMUMS requis
      for (const group of selectedProduct.option_groups) {
          const selectedCount = currentOptions.filter(opt => group.items.find((i:any) => i.id === opt.id)).length;
          if (selectedCount < group.min) {
              Alert.alert("Attention", `Veuillez sélectionner au moins ${group.min} option(s) pour "${group.name}".`);
              return;
          }
      }

      // Si tout est bon, on ajoute
      const unitPrice = selectedProduct.price + currentOptions.reduce((acc, opt) => acc + (opt.price || 0), 0);
      
      addItem({
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          finalPrice: unitPrice,
          image_url: selectedProduct.image_url,
          quantity: tempQty,
          selectedOptions: currentOptions,
          removedIngredients: excludedIngredients
      });

      setSelectedProduct(null);
  };

  const toggleIngredient = (ingredientName: string) => {
    if (excludedIngredients.includes(ingredientName)) {
        setExcludedIngredients(excludedIngredients.filter(ing => ing !== ingredientName));
    } else {
        setExcludedIngredients([...excludedIngredients, ingredientName]);
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const optionsPrice = currentOptions.reduce((acc, opt) => acc + (opt.price || 0), 0);
    return (selectedProduct.price + optionsPrice) * tempQty;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View>;
  if (!store) return <View style={styles.center}><Text>Restaurant indisponible</Text></View>;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.blob, { backgroundColor: PRIMARY, top: -100, left: -100, opacity: 0.1 }]} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.headerGlass}>
            <View style={styles.headerTopRow}>
                <View style={{ flex: 1, paddingRight: 10, justifyContent: 'center' }}>
                    <Text style={styles.welcomeText}>Bienvenue chez</Text>
                    <Text style={[styles.storeName, { color: PRIMARY }]} numberOfLines={1}>{store.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View style={[styles.statusDot, { backgroundColor: store.is_open ? '#22C55E' : '#EF4444' }]} />
                        <Text style={styles.storeDesc}>{store.is_open ? 'Ouvert' : 'Fermé'}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.logoWrapper}>
                        {store.logo_url ? <Image source={{ uri: store.logo_url }} style={[styles.logo, { borderColor: PRIMARY }]} /> : <View style={[styles.logo, {backgroundColor: PRIMARY}]} />}
                    </View>
                    <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartButton}>
                        <Ionicons name="bag-handle-outline" size={22} color={PRIMARY} />
                        {cartItemCount > 0 && <View style={[styles.badge, { backgroundColor: PRIMARY, borderColor: 'white' }]}><Text style={[styles.badgeText, { color: SECONDARY }]}>{cartItemCount}</Text></View>}
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 16 }}>
                <TouchableOpacity onPress={() => setSelectedCategory(null)} style={[styles.categoryPill, selectedCategory === null && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}>
                    <Text style={[styles.categoryText, selectedCategory === null && { color: SECONDARY }]}>Tout</Text>
                </TouchableOpacity>
                {categories.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                        <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)} style={[styles.categoryPill, isActive && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}>
                            <Text style={[styles.categoryText, isActive && { color: SECONDARY }]}>{cat.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>

        {/* Liste Produits */}
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {displayedCategories.map((category) => (
                <View key={category.id} style={{ marginBottom: 30 }}>
                    <Text style={[styles.sectionTitle, { color: PRIMARY }]}>{category.name}</Text>
                    {category.products.map((product) => (
                        <TouchableOpacity key={product.id} style={styles.card} activeOpacity={0.9} onPress={() => openProductDetail(product)}>
                            <Image source={product.image_url ? { uri: product.image_url } : { uri: 'https://via.placeholder.com/150' }} style={styles.cardImage} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.productName, { color: PRIMARY }]}>{product.name}</Text>
                                <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                                <View style={{flexDirection:'row', gap:4, marginTop:4}}>
                                    {product.ingredients?.length > 0 && <View style={{backgroundColor:'#f0fdf4', paddingHorizontal:6, paddingVertical:2, borderRadius:4}}><Text style={{fontSize:10, color:'#166534'}}>{product.ingredients.length} Ingr.</Text></View>}
                                    {product.option_groups?.length > 0 && <View style={{backgroundColor:'#eff6ff', paddingHorizontal:6, paddingVertical:2, borderRadius:4}}><Text style={{fontSize:10, color:'#1e40af'}}>{product.option_groups.length} Options</Text></View>}
                                </View>
                                <Text style={styles.priceText}>{product.price} DH</Text>
                            </View>
                            <View style={[styles.addButton, { backgroundColor: store.is_open ? PRIMARY : '#ccc' }]}>
                                <Ionicons name="add" size={20} color={store.is_open ? SECONDARY : '#666'} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            {displayedCategories.length === 0 && <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>Aucun produit trouvé.</Text>}
        </ScrollView>
      </SafeAreaView>

      {/* MODALE DETAIL */}
      <Modal visible={!!selectedProduct} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: SECONDARY }]}>
                {selectedProduct && (
                    <>
                        <View style={styles.modalImageContainer}>
                            <Image source={selectedProduct.image_url ? { uri: selectedProduct.image_url } : { uri: 'https://via.placeholder.com/300' }} style={styles.modalImage} />
                            <TouchableOpacity onPress={() => setSelectedProduct(null)} style={[styles.closeButton, { backgroundColor: PRIMARY }]}>
                                <Ionicons name="close" size={24} color={SECONDARY} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 180 }}>
                            <Text style={[styles.modalTitle, { color: PRIMARY }]}>{selectedProduct.name}</Text>
                            <Text style={[styles.modalPrice, { color: PRIMARY }]}>{selectedProduct.price} DH</Text>
                            <Text style={[styles.modalDesc, { color: PRIMARY, opacity: 0.8 }]}>{selectedProduct.description || "Aucune description disponible."}</Text>
                            
                            {/* Ingrédients */}
                            {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                    <Text style={[styles.sectionHeader, { color: PRIMARY }]}>Ingrédients</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                        {selectedProduct.ingredients.map((ing: any, i: number) => {
                                            const isExcluded = excludedIngredients.includes(ing.name);
                                            return (
                                                <TouchableOpacity key={ing.id || i} onPress={() => toggleIngredient(ing.name)} style={[styles.ingredientTag, { borderColor: PRIMARY, backgroundColor: isExcluded ? '#FEF2F2' : 'transparent' }]}>
                                                    {isExcluded ? <Ionicons name="close-circle" size={16} color="#EF4444" style={{marginRight: 4}} /> : <Ionicons name="checkmark-circle" size={16} color={PRIMARY} style={{marginRight: 4}} />}
                                                    <Text style={[styles.ingredientText, { color: isExcluded ? '#EF4444' : PRIMARY }, isExcluded && styles.ingredientTextExcluded]}>{ing.name}</Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Options */}
                            {selectedProduct.option_groups && selectedProduct.option_groups.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                    {selectedProduct.option_groups.map((group: any) => (
                                        <View key={group.id} style={{marginBottom: 20}}>
                                            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                                                <Text style={[styles.sectionHeader, { color: PRIMARY, fontSize: 16, marginBottom:0 }]}>{group.name}</Text>
                                                <View style={{flexDirection:'row', gap:4}}>
                                                    {group.min > 0 && <Text style={{fontSize:10, fontWeight:'bold', color:'white', backgroundColor:'#EF4444', paddingHorizontal:6, paddingVertical:2, borderRadius:4}}>Requis {group.min}</Text>}
                                                    {group.max > 1 && <Text style={{fontSize:10, fontWeight:'bold', color:'white', backgroundColor:'#3B82F6', paddingHorizontal:6, paddingVertical:2, borderRadius:4}}>Max {group.max}</Text>}
                                                </View>
                                            </View>
                                            
                                            {group.items?.map((item: any) => {
                                                const isSelected = currentOptions.some(opt => opt.id === item.id);
                                                return (
                                                    <TouchableOpacity key={item.id} onPress={() => toggleOption(group, item)} style={[styles.optionRow, { borderColor: PRIMARY }, isSelected && { backgroundColor: PRIMARY + '20' }]}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={[styles.optionName, { color: PRIMARY, fontWeight: isSelected ? 'bold' : '500' }]}>{item.name}</Text>
                                                            <Text style={[styles.optionPrice, { color: PRIMARY, opacity: 0.7 }]}>+{item.price} DH</Text>
                                                        </View>
                                                        <View style={[styles.checkbox, { borderColor: PRIMARY }, isSelected && { backgroundColor: PRIMARY }]}>
                                                            {isSelected && <Ionicons name="checkmark" size={14} color={SECONDARY} />}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        <View style={[styles.modalFooter, { backgroundColor: SECONDARY, borderTopColor: PRIMARY + '20' }]}>
                            <View style={[styles.qtyControl, { backgroundColor: PRIMARY + '20' }]}>
                                <TouchableOpacity onPress={() => setTempQty(Math.max(1, tempQty - 1))} style={styles.qtyBtn}><Ionicons name="remove" size={24} color={PRIMARY}/></TouchableOpacity>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', minWidth: 20, textAlign: 'center', color: PRIMARY }}>{tempQty}</Text>
                                <TouchableOpacity onPress={() => setTempQty(tempQty + 1)} style={styles.qtyBtn}><Ionicons name="add" size={24} color={PRIMARY}/></TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={validateAndAdd} style={[styles.confirmButton, { backgroundColor: store.is_open ? PRIMARY : '#ccc' }]} disabled={!store.is_open}>
                                <Text style={{ color: SECONDARY, fontWeight: 'bold', fontSize: 16 }}>Ajouter {calculateTotal().toFixed(2)} DH</Text>
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
    headerGlass: { backgroundColor: 'rgba(255,255,255,0.95)', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingTop: 10, shadowColor: "#000", shadowOpacity: 0.05, elevation: 5 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
    welcomeText: { fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 2 },
    logoWrapper: { shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 },
    logo: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5 },
    storeName: { fontSize: 22, fontWeight: '900' },
    storeDesc: { fontSize: 12, color: '#666', fontWeight: '500' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    cartButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.1, borderWidth: 1, borderColor: '#f0f0f0' },
    badge: { position: 'absolute', top: -2, right: -2, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    categoryPill: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.8)' },
    categoryText: { fontWeight: '700', fontSize: 13, color: '#666' },
    sectionTitle: { fontSize: 24, fontWeight: '900', marginBottom: 16 }, 
    card: { backgroundColor: 'white', borderRadius: 24, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 16, shadowOpacity: 0.05, shadowOffset: {width:0, height:5} },
    cardImage: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#eee' },
    productName: { fontWeight: '800', fontSize: 16 }, 
    productDesc: { color: '#666', fontSize: 12, marginVertical: 4 },
    priceText: { fontWeight: '700', fontSize: 14, color: '#333' },
    addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 12, bottom: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '95%', overflow: 'hidden' }, 
    modalImageContainer: { height: 250, width: '100%', position: 'relative' },
    modalImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    closeButton: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.2 },
    modalTitle: { fontSize: 28, fontWeight: '900', marginBottom: 5 },
    modalPrice: { fontSize: 22, fontWeight: '700', marginBottom: 15 },
    modalDesc: { fontSize: 16, lineHeight: 24 },
    sectionHeader: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
    ingredientTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 5 },
    ingredientText: { fontSize: 14, fontWeight: '600' },
    ingredientTextExcluded: { textDecorationLine: 'line-through' },
    optionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    optionName: { fontSize: 15, fontWeight: '500' },
    optionPrice: { fontSize: 13, marginTop: 2 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    modalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, borderTopWidth: 1, flexDirection: 'row', gap: 15, alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:-5}, shadowOpacity: 0.05, elevation: 10 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 12, borderRadius: 16 },
    qtyBtn: { padding: 5 },
    confirmButton: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }
});
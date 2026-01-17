import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Asset type definition
interface Asset {
  id: string;
  assetName: string;
  amount: number;
  category: string;
  description?: string;
  createdAt?: { toDate: () => Date };
}

interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
  categoryValue: string;
}

// Category name mapping type
type CategoryKey = 'bank' | 'investment' | 'property' | 'income' | 'others';

const categoryNames: Record<CategoryKey, string> = {
  'bank': 'Simpanan',
  'investment': 'Pelaburan',
  'property': 'Hartanah',
  'income': 'Pendapatan',
  'others': 'Lain-Lain',
};

const categoryIcons: Record<CategoryKey, string> = {
  'bank': '🏦',
  'investment': '💰',
  'property': '🏠',
  'income': '💵',
  'others': '❓',
};

export default function DynamicAssetCategoryScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const params = useLocalSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo>({
    name: 'Kategori Aset',
    icon: '💰',
    color: '#48BB78',
    categoryValue: '',
  });

  useEffect(() => {
    loadCategoryInfo();
  }, [params]);

  const loadCategoryInfo = async () => {
    try {
      // Get category value from params (e.g., "emas", "tanah")
      const categoryValue = params.category as string;

      if (!categoryValue) return;

      // Try to find in custom categories
      const customCategoriesJson = await AsyncStorage.getItem('customAssetCategories');
      if (customCategoriesJson) {
        const customCategories = JSON.parse(customCategoriesJson);
        const foundCategory = customCategories.find((cat: { value: string }) => cat.value === categoryValue);

        if (foundCategory) {
          setCategoryInfo({
            name: foundCategory.label,
            icon: foundCategory.icon || '💰',
            color: foundCategory.color || '#48BB78',
            categoryValue: categoryValue,
          });
        } else {
          // Fallback to default categories
          setCategoryInfo({
            name: getCategoryName(categoryValue),
            icon: getCategoryIcon(categoryValue),
            color: '#48BB78',
            categoryValue: categoryValue,
          });
        }
      } else {
        // No custom categories, use defaults
        setCategoryInfo({
          name: getCategoryName(categoryValue),
          icon: getCategoryIcon(categoryValue),
          color: '#48BB78',
          categoryValue: categoryValue,
        });
      }

      // Load assets for this category
      loadAssets(categoryValue);
    } catch (error) {
      console.error('Error loading category info:', error);
    }
  };

  const loadAssets = (categoryValue: string) => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .where('category', '==', categoryValue)
        .onSnapshot(querySnapshot => {
          const assetsData: Asset[] = [];
          querySnapshot.forEach(doc => {
            assetsData.push({ id: doc.id, ...doc.data() } as Asset);
          });
          setAssets(assetsData);
        });

      return () => unsubscribe();
    }
  };

  const getCategoryName = (categoryValue: string): string => {
    if (categoryValue in categoryNames) {
      return categoryNames[categoryValue as CategoryKey];
    }
    return categoryValue;
  };

  const getCategoryIcon = (categoryValue: string): string => {
    if (categoryValue in categoryIcons) {
      return categoryIcons[categoryValue as CategoryKey];
    }
    return '💰';
  };

  const renderItem = ({ item }: { item: Asset }) => (
    <View style={styles.assetItem}>
      <View style={styles.assetLeft}>
        <Text style={[styles.assetIcon, { fontSize: fontSize.title }]}>{categoryInfo.icon}</Text>
        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { fontSize: fontSize.medium }]}>{item.assetName}</Text>
          {item.description ? (
            <Text style={[styles.assetDescription, { fontSize: fontSize.small }]}>{item.description}</Text>
          ) : null}
          {item.createdAt && (
            <Text style={[styles.assetDate, { fontSize: fontSize.small }]}>
              {new Date(item.createdAt.toDate()).toLocaleDateString('en-GB')}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.assetRight}>
        <Text style={[styles.assetAmount, { fontSize: fontSize.medium }]}>RM {item.amount.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => router.push(`/editAsset/${item.id}`)}>
          <MaterialIcons name="edit" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const totalAmount = assets.reduce((sum, asset) => sum + (asset.amount || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { backgroundColor: categoryInfo.color }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{categoryInfo.icon}</Text>
          <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{categoryInfo.name}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: categoryInfo.color }]}>
        <Text style={[styles.summaryLabel, { fontSize: fontSize.small }]}>Jumlah {categoryInfo.name}</Text>
        <Text style={[styles.summaryAmount, { fontSize: fontSize.heading }]}>RM {totalAmount.toFixed(2)}</Text>
        <Text style={[styles.summaryCount, { fontSize: fontSize.small }]}>{assets.length} aset</Text>
      </View>

      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, { fontSize: fontSize.heading }]}>{categoryInfo.icon}</Text>
            <Text style={[styles.emptyText, { fontSize: fontSize.medium }]}>
              Tiada aset {categoryInfo.name.toLowerCase()}.
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: categoryInfo.color }]}
              onPress={() => router.push('/addAsset')}
            >
              <Text style={[styles.addButtonText, { fontSize: fontSize.medium }]}>Tambah Aset</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#fff',
    opacity: 0.9,
  },
  summaryAmount: {
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  summaryCount: {
    color: '#fff',
    opacity: 0.9,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  assetItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  assetIcon: {
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontWeight: 'bold',
  },
  assetDescription: {
    color: '#666',
    marginTop: 4,
  },
  assetDate: {
    color: '#999',
    marginTop: 4,
  },
  assetRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  assetAmount: {
    fontWeight: 'bold',
    color: '#48BB78',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    marginBottom: 24,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


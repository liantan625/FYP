import React, { useState, useEffect, useMemo, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

interface CustomCategory {
  value: string;
  label: string;
  icon: string;
}

interface AssetCategory {
  id: string;
  type: string;
  icon: string;
  name: string;
  total: number;
  count: number;
  subtitle: string;
}

interface Asset {
  id: string;
  date: Date;
  category: string;
  assetName: string;
  amount: number;
  description: string;
  isRecurringIncome: boolean;
}

export default function AnalysisScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [customAssetCategories, setCustomAssetCategories] = useState<CustomCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);

  // Memoize helper functions to prevent unnecessary re-renders
  const getCategoryIcon = useCallback((categoryType: string): string => {
    // First check custom categories
    const customCategory = customAssetCategories.find(cat => cat.value === categoryType);
    if (customCategory) {
      return customCategory.icon;
    }

    // Fallback to default categories
    switch (categoryType) {
      case 'bank': return '🏦';
      case 'investment': return '💰';
      case 'property': return '🏠';
      case 'income': return '💵';
      case 'others': return '📦'; // Changed from ❓ to 📦 for better UI
      default: return '📦'; // Use a generic box for unknown types
    }
  }, [customAssetCategories]);

  const getCategoryName = useCallback((categoryType: string): string => {
    // First check custom categories
    const customCategory = customAssetCategories.find(cat => cat.value === categoryType);
    if (customCategory) {
      return customCategory.label;
    }

    // Fallback to default categories
    switch (categoryType) {
      case 'bank': return t('asset.bank');
      case 'investment': return t('asset.investment');
      case 'property': return t('asset.property');
      case 'income': return t('asset.income');
      case 'others': return t('asset.others');
      default:
        // If it's a slug, capitalize it (e.g., "emas" -> "Emas")
        return categoryType.charAt(0).toUpperCase() + categoryType.slice(1).replace(/_/g, ' ');
    }
  }, [customAssetCategories, t]);

  // Load custom asset categories on mount
  const loadCustomCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const customCategoriesJson = await AsyncStorage.getItem('customAssetCategories');
      if (customCategoriesJson) {
        const categories = JSON.parse(customCategoriesJson);
        console.log('Loaded custom categories:', categories);
        setCustomAssetCategories(categories);
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
      Alert.alert(t('common.error'), t('asset.errorLoadingCategories'));
    } finally {
      setIsLoadingCategories(false);
    }
  }, [t]);

  useEffect(() => {
    loadCustomCategories();
  }, [loadCustomCategories]);

  // Only start Firestore subscription after custom categories are loaded
  useEffect(() => {
    if (isLoadingCategories) {
      console.log('Waiting for custom categories to load...');
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    console.log('Starting Firestore subscription...');
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('assets')
      .onSnapshot(
        querySnapshot => {
          if (!querySnapshot) return;
          console.log(`Received ${querySnapshot.size} assets from Firestore`);
          const categoriesMap = new Map();

          querySnapshot.forEach(doc => {
            const asset = doc.data();
            const categoryType = asset.category;

            if (!categoryType) {
              console.warn('Asset missing category:', doc.id);
              return;
            }

            if (!categoriesMap.has(categoryType)) {
              const icon = getCategoryIcon(categoryType);
              const name = getCategoryName(categoryType);
              console.log(`Creating category: ${categoryType} with icon: ${icon} and name: ${name}`);

              categoriesMap.set(categoryType, {
                id: categoryType,
                type: categoryType,
                icon: icon,
                name: name,
                total: 0,
                count: 0,
                subtitle: '',
              });
            }

            const categoryData = categoriesMap.get(categoryType);
            categoryData.total += asset.amount || 0;
            categoryData.count++;
            categoriesMap.set(categoryType, categoryData);
          });

          const dynamicCategories = Array.from(categoriesMap.values()).map(category => {
            let subtitle = '';
            if (category.count === 0) {
              subtitle = t('asset.subtitles.noAssets');
            } else if (category.type === 'bank') {
              subtitle = `${category.count} ${category.count === 1 ? t('asset.subtitles.account') : t('asset.subtitles.accounts')}`;
            } else {
              subtitle = `${category.count} ${category.count === 1 ? t('asset.subtitles.portfolio') : t('asset.subtitles.portfolios')}`;
            }

            return {
              ...category,
              subtitle,
            };
          });

          console.log('Setting asset categories:', dynamicCategories);
          setAssetCategories(dynamicCategories);
        },
        error => {
          console.error('Firestore subscription error:', error);
          Alert.alert(t('common.error'), t('asset.errorLoadingAssets'));
        }
      );

    return () => {
      console.log('Cleaning up Firestore subscription');
      unsubscribe();
    };
  }, [isLoadingCategories, getCategoryIcon, getCategoryName, t]);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .onSnapshot(
          querySnapshot => {
            const assetsList: Asset[] = [];
            let total = 0;
            if (querySnapshot && !querySnapshot.empty) {
              querySnapshot.forEach(documentSnapshot => {
                const data = documentSnapshot.data();
                const amount = data?.amount || 0;
                total += amount;
                assetsList.push({
                  id: documentSnapshot.id,
                  date: data?.date?.toDate ? data.date.toDate() : new Date(data?.date),
                  category: data?.category || '',
                  assetName: data?.assetName || '',
                  amount: amount,
                  description: data?.description || '',
                  isRecurringIncome: data?.isRecurringIncome || false,
                });
              });
            }
            console.log('Assets List:', assetsList.length, 'Total:', total);
            setAssets(assetsList);
            setTotalAssets(total);
          },
          error => {
            console.error("Error fetching assets: ", error);
          }
        );

      return () => unsubscribe();
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('asset.title')}</Text>
          <View style={{ width: 24 }} />
        </View>


        {/* Asset Summary Section */}
        <View style={styles.assetSummaryContainer}>
          <View style={styles.assetSummaryCard}>
            <Text style={[styles.assetSummaryLabel, { fontSize: fontSize.medium }]}>{t('asset.totalAssets')}</Text>
            <Text style={[styles.assetSummaryAmount, { fontSize: fontSize.heading }]}>RM {totalAssets.toFixed(2)}</Text>
            <TouchableOpacity style={styles.addAssetButton} onPress={() => router.push('/addAsset')}>
              <Text style={[styles.addAssetButtonText, { fontSize: fontSize.medium }]}>{t('asset.addAsset')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Asset List Section */}
        <View style={styles.assetListContainer}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('asset.yourAssets')}</Text>
          {isLoadingCategories ? (
            <Text style={[styles.loadingText, { fontSize: fontSize.medium }]}>{t('common.loading')}</Text>
          ) : assetCategories.length === 0 ? (
            <Text style={[styles.emptyText, { fontSize: fontSize.medium }]}>{t('asset.noAssets')}</Text>
          ) : (
            assetCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={styles.assetCard}
                onPress={() => router.push(`/${category.type}?category=${category.type}`)}
              >
                <View style={styles.assetCardLeft}>
                  <Text style={[styles.assetIcon, { fontSize: fontSize.title }]}>{category.icon}</Text>
                  <View style={styles.assetTextContainer}>
                    <Text style={[styles.assetName, { fontSize: fontSize.medium }]} numberOfLines={1}>{category.name}</Text>
                    <Text style={[styles.assetSubtitle, { fontSize: fontSize.small }]}>{category.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.assetCardRight}>
                  <Text style={[styles.assetAmount, { fontSize: fontSize.medium }]} numberOfLines={1}>RM {category.total.toFixed(2)}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Add Category Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/addAssetCategory')}>
          <Text style={[styles.addButtonText, { fontSize: fontSize.medium }]}>+ {t('asset.addNewCategory')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryAmount: {
    fontWeight: 'bold',
  },
  negativeAmount: {
    color: '#FF6B6B',
  },
  assetSummaryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  assetSummaryCard: {
    backgroundColor: '#48BB78',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  assetSummaryLabel: {
    color: '#fff',
  },
  assetSummaryAmount: {
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  addAssetButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  addAssetButtonText: {
    fontWeight: 'bold',
    color: '#48BB78',
  },
  assetListContainer: {
    padding: 20,
  },
  assetCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  assetIcon: {
    marginRight: 12,
  },
  assetTextContainer: {
    flex: 1,
  },
  assetName: {
    fontWeight: 'bold',
  },
  assetSubtitle: {
    color: '#666',
    marginTop: 2,
  },
  assetCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  assetAmount: {
    fontWeight: 'bold',
    marginRight: 6,
    textAlign: 'right',
  },
  addButton: {
    backgroundColor: '#48BB78',
    borderRadius: 12,
    paddingVertical: 16,
    margin: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const MOCK_DATA = {
  summary: {
    monthlyIncome: 4000.00,
    foodExpenses: 100.00
  },
  retirement: {
    totalAssets: 7783.00
  },
  assetCategories: [
    {
      id: 1,
      type: "bank",
      icon: "🏦",
      name: "Simpanan Bank",
      total: 5500.00,
      count: 3,
      subtitle: "3 akaun",
      items: [
        { name: "Simpanan Bank", bank: "Maybank", amount: 5500.00 },
        { name: "Akaun Semasa", bank: "CIMB", amount: 0.00 },
        { name: "Akaun FD", bank: "Public Bank", amount: 0.00 }
      ]
    },
    {
      id: 2,
      type: "investment",
      icon: "💰",
      name: "Pelaburan",
      total: 2283.00,
      count: 2,
      subtitle: "2 portfolio",
      items: [
        { name: "ASNB", type: "Unit Trust", amount: 2283.00 },
        { name: "Saham", type: "Stocks", amount: 0.00 }
      ]
    },
    {
      id: 3,
      type: "property",
      icon: "🏠",
      name: "Hartanah",
      total: 0.00,
      count: 0,
      subtitle: "Tiada aset",
      items: []
    }
  ]
};

const screenWidth = Dimensions.get("window").width;

export default function AnalysisScreen() {
  const router = useRouter();
  const [assetCategories, setAssetCategories] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .onSnapshot(querySnapshot => {
          const categoriesMap = new Map();

          querySnapshot.forEach(doc => {
            const asset = doc.data();
            const categoryType = asset.category;

            if (!categoriesMap.has(categoryType)) {
              categoriesMap.set(categoryType, {
                id: categoryType, // Use categoryType as id for simplicity
                type: categoryType,
                icon: getCategoryIcon(categoryType), // Helper function to get icon
                name: getCategoryName(categoryType), // Helper function to get name
                total: 0,
                count: 0,
                subtitle: '',
              });
            }

            const categoryData = categoriesMap.get(categoryType);
            categoryData.total += asset.amount;
            categoryData.count++;
            categoriesMap.set(categoryType, categoryData);
          });

          const dynamicCategories = Array.from(categoriesMap.values()).map(category => ({
            ...category,
            subtitle: `${category.count} ${category.type === 'bank' ? 'akaun' : 'portfolio'}`,
          }));

          setAssetCategories(dynamicCategories);
        });

      return () => unsubscribe();
    }
  }, []);

  const totalAssets = assetCategories.reduce((sum, category) => sum + category.total, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analisis Dana Persaraan</Text>
          <View style={{ width: 24 }} />
        </View>


        {/* Asset Summary Section */}
        <View style={styles.assetSummaryContainer}>
          <View style={styles.assetSummaryCard}>
            <Text style={styles.assetSummaryLabel}>Jumlah Aset Persaraan</Text>
            <Text style={styles.assetSummaryAmount}>RM {totalAssets.toFixed(2)}</Text>
            <TouchableOpacity style={styles.addAssetButton} onPress={() => router.push('/addAsset')}>
              <Text style={styles.addAssetButtonText}>Tambah Aset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Asset List Section */}
        <View style={styles.assetListContainer}>
          <Text style={styles.sectionTitle}>Jenis Aset</Text>
          {assetCategories.map(category => (
            <TouchableOpacity key={category.id} style={styles.assetCard} onPress={() => router.push(`/${category.name.replace(/\s/g, '')}`)}>
              <View style={styles.assetCardLeft}>
                <Text style={styles.assetIcon}>{category.icon}</Text>
                <View>
                  <Text style={styles.assetName}>{category.name}</Text>
                  <Text style={styles.assetSubtitle}>{category.subtitle}</Text>
                </View>
              </View>
              <View style={styles.assetCardRight}>
                <Text style={styles.assetAmount}>RM {category.total.toFixed(2)}</Text>
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getCategoryIcon = (categoryType) => {
  switch (categoryType) {
    case 'bank': return '🏦';
    case 'investment': return '💰';
    case 'property': return '🏠';
    case 'income': return '💵';
    case 'others': return '❓';
    default: return '❓';
  }
};

const getCategoryName = (categoryType) => {
  switch (categoryType) {
    case 'bank': return 'Simpanan Bank';
    case 'investment': return 'Pelaburan';
    case 'property': return 'Hartanah';
    case 'income': return 'Pendapatan';
    case 'others': return 'LainLain';
    default: return 'Tidak Diketahui';
  }
};

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
    fontSize: 18,
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
    fontSize: 16,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  negativeAmount: {
    color: '#FF6B6B',
  },
  assetSummaryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
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
    fontSize: 16,
    color: '#fff',
  },
  assetSummaryAmount: {
    fontSize: 32,
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
    fontSize: 16,
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
  },
  assetIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  assetCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
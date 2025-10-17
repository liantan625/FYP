import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlySpent: number;
  isPopular?: boolean;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  budgetGoal: number;
  percentageUsed: number;
  message?: string;
}

const MOCK_DATA = {
  summary: {
    totalIncome: 7783.00,
    totalExpenses: 1187.40,
    budgetGoal: 20000.00,
    percentageUsed: 30,
    message: "Hebat Kerana Konsisten!",
  },
  categories: [
    {
      id: '1',
      name: 'Makanan',
      icon: '🍴',
      color: '#4A9EFF',
      monthlySpent: 600.00,
      isPopular: true,
    },
    {
      id: '2',
      name: 'Pengangkutan',
      icon: '🚌',
      color: '#6B9EFF',
      monthlySpent: 287.00,
      isPopular: true,
    },
    {
      id: '3',
      name: 'Perubatan',
      icon: '💊',
      color: '#8BB4FF',
      monthlySpent: 300.00,
      isPopular: true,
    },
    {
      id: '4',
      name: 'Runcit',
      icon: '🛒',
      color: '#4A9EFF',
      monthlySpent: 200.00,
    },
    {
      id: '5',
      name: 'Sewa',
      icon: '🏠',
      color: '#6B9EFF',
      monthlySpent: 500.00,
    },
    {
      id: '6',
      name: 'Perayaan',
      icon: '🎁',
      color: '#8BB4FF',
      monthlySpent: 0.00,
    },
    {
      id: '7',
      name: 'Simpanan',
      icon: '💰',
      color: '#4A9EFF',
      monthlySpent: 1200.00,
    },
    {
      id: '8',
      name: 'Hiburan',
      icon: '🎟️',
      color: '#6B9EFF',
      monthlySpent: 150.00,
    },
  ],
};

export default function CategoryScreen() {
  const router = useRouter();
  const popularCategories = MOCK_DATA.categories.filter(c => c.isPopular);
  const otherCategories = MOCK_DATA.categories.filter(c => !c.isPopular);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengurus Perbelanjaan</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.summaryContainer}>
          <Text style={styles.incomeLabel}>Jumlah Pendapatan</Text>
          <Text style={styles.incomeAmount}>RM {MOCK_DATA.summary.totalIncome.toFixed(2)}</Text>
          <Text style={styles.expenseLabel}>Perbelanjaan: -RM {MOCK_DATA.summary.totalExpenses.toFixed(2)}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${MOCK_DATA.summary.percentageUsed}%` }]} />
            <Text style={styles.progressPercentage}>{MOCK_DATA.summary.percentageUsed}%</Text>
          </View>
          <Text style={styles.progressText}>RM {MOCK_DATA.summary.totalIncome.toFixed(2)} / RM {MOCK_DATA.summary.budgetGoal.toFixed(2)}</Text>
          <Text style={styles.summaryMessage}>✓ {MOCK_DATA.summary.message}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Kategori Popular</Text>
          <View style={styles.popularCategoriesContainer}>
            {popularCategories.map(category => (
              <TouchableOpacity key={category.id} style={styles.popularCategoryCard} onPress={() => Alert.alert(category.name, `Spent: RM${category.monthlySpent.toFixed(2)}`)}>
                <Text style={styles.popularCategoryIcon}>{category.icon}</Text>
                <Text style={styles.popularCategoryName}>{category.name}</Text>
                <Text style={styles.popularCategoryAmount}>RM{category.monthlySpent.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Semua Kategori</Text>
          <View style={styles.allCategoriesContainer}>
            {otherCategories.map(category => (
              <TouchableOpacity key={category.id} style={styles.categoryCard} onPress={() => Alert.alert(category.name, `Spent: RM${category.monthlySpent.toFixed(2)}`)}>
                <Text style={styles.categoryIcon}>{category.icon} {category.name}</Text>
                <Text style={styles.categoryAmount}>RM{category.monthlySpent.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert('Tambah Kategori Baharu', 'This feature is coming soon!')}>
          <Text style={styles.addButtonText}>+ Tambah Kategori Baharu</Text>
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
  header: {
    backgroundColor: '#00D9A8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#00D9A8',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  incomeLabel: {
    fontSize: 16,
    color: '#fff',
  },
  incomeAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#fff',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    marginTop: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#2D3748',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#fff',
    position: 'absolute',
    right: 10,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  summaryMessage: {
    fontSize: 14,
    color: '#fff',
    marginTop: 10,
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  popularCategoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  popularCategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '30%',
  },
  popularCategoryIcon: {
    fontSize: 32,
  },
  popularCategoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  popularCategoryAmount: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  allCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    marginBottom: 15,
  },
  categoryIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#00D9A8',
    borderRadius: 12,
    paddingVertical: 16,
    margin: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
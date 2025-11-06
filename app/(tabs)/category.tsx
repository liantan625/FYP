import React, { useState, useEffect } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlySpent: number;
  isPopular?: boolean;
}

export interface BudgetSummary {
  totalExpenses: number;
  percentageUsed: number;
}



const budgetGoal = 10000.00;

const categoriesData = [
  {
    id: '1',
    name: 'Runcit',
    icon: '🛒',
    color: '#4A9EFF',
    monthlySpent: 0,
    isPopular: true,
  },
  {
    id: '2',
    name: 'Sewa',
    icon: '🏠',
    color: '#6B9EFF',
    monthlySpent: 0,
    isPopular: true,
  },
  {
    id: '3',
    name: 'Perayaan',
    icon: '🎁',
    color: '#8BB4FF',
    monthlySpent: 0,
    isPopular: true,
  },
  {
    id: '4',
    name: 'Hiburan',
    icon: '🎟️',
    color: '#4A9EFF',
    monthlySpent: 0,
  },
  {
    id: '5',
    name: 'Lain-Lain',
    icon: '🤷',
    color: '#6B9EFF',
    monthlySpent: 0,
  },
];

export default function CategoryScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>(categoriesData);
  const [summary, setSummary] = useState<BudgetSummary>({
    totalExpenses: 0,
    percentageUsed: 0,
  });

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .onSnapshot(querySnapshot => {
          const spendingsByCategory = {};

          const categoryMap = {
            'Runcit': 'groceries',
            'Sewa': 'rent',
            'Perayaan': 'celebration',
            'Hiburan': 'entertainment',
            'Lain-Lain': 'others',
          };

          querySnapshot.forEach(doc => {
            const spending = doc.data();
            const categoryName = spending.category;
            const amount = spending.amount;

            const mappedCategoryName = Object.keys(categoryMap).find(key => categoryMap[key] === categoryName);

            if (spendingsByCategory[mappedCategoryName]) {
              spendingsByCategory[mappedCategoryName] += amount;
            } else {
              spendingsByCategory[mappedCategoryName] = amount;
            }
          });

          const updatedCategories = categoriesData.map(category => ({
            ...category,
            monthlySpent: spendingsByCategory[category.name] || 0,
          }));

          setCategories(updatedCategories);

          const totalExpenses = Object.values(spendingsByCategory).reduce((acc, val) => acc + val, 0);

          setSummary(prevSummary => ({
            ...prevSummary,
            totalExpenses,
            percentageUsed: (totalExpenses / budgetGoal) * 100,
          }));
        });

      return () => unsubscribe();
    }
  }, []);

  const handleCategoryPress = (categoryName: string) => {
    let screenName = '';
    switch (categoryName) {
      case 'Runcit':
        screenName = '/Runcit';
        break;
      case 'Sewa':
        screenName = '/Sewa';
        break;
      case 'Perayaan':
        screenName = '/Perayaan';
        break;
      case 'Hiburan':
        screenName = '/Hiburan';
        break;
      case 'Lain-Lain':
        screenName = '/LainLainSpending';
        break;
      default:
        break;
    }
    if (screenName) {
      router.push(screenName);
    }
  };

  const popularCategories = categories.filter(c => c.isPopular);
  const otherCategories = categories.filter(c => !c.isPopular);

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
          <Text style={styles.summaryTitle}>Ringkasan Perbelanjaan</Text>
          <Text style={styles.totalSpendingText}>Perbelanjaan: -RM {summary.totalExpenses.toFixed(2)}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${summary.percentageUsed.toFixed(0)}%` }]} />
            <Text style={styles.progressPercentage}>{summary.percentageUsed.toFixed(0)}%</Text>
          </View>
          <Text style={styles.progressText}>RM{summary.totalExpenses.toFixed(2)} / RM{budgetGoal.toFixed(2)}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Kategori Popular</Text>
          <View style={styles.popularCategoriesContainer}>
            {popularCategories.map(category => (
              <TouchableOpacity key={category.name} style={styles.popularCategoryCard} onPress={() => handleCategoryPress(category.name)}>
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
              <TouchableOpacity key={category.name} style={styles.categoryCard} onPress={() => handleCategoryPress(category.name)}>
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
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/addSpending')}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  totalSpendingText: {
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
    color: '#2D3748',
    position: 'absolute',
    right: 10,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
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
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#00D9A8',
    borderRadius: 28,
    elevation: 8,
  },
});
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
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export interface ExpenseCategory {
  id: string;
  name: string;
  key: string;
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
    key: 'groceries',
    icon: '🛒',
    color: '#4A9EFF',
    monthlySpent: 0,
    isPopular: true,
  },
  {
    id: '2',
    name: 'Sewa',
    key: 'rent',
    icon: '🏠',
    color: '#6B9EFF',
    monthlySpent: 0,
    isPopular: true,
  },
  {
    id: '3',
    name: 'Perayaan',
    key: 'celebration',
    icon: '🎁',
    color: '#8BB4FF',
    monthlySpent: 0,
    isPopular: true,
  },
  {
    id: '4',
    name: 'Hiburan',
    key: 'entertainment',
    icon: '🎟️',
    color: '#4A9EFF',
    monthlySpent: 0,
  },
  {
    id: '5',
    name: 'Lain-Lain',
    key: 'others',
    icon: '🤷',
    color: '#6B9EFF',
    monthlySpent: 0,
  },
];

export default function SpendingScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ExpenseCategory[]>(categoriesData);
  const [summary, setSummary] = useState<BudgetSummary>({
    totalExpenses: 0,
    percentageUsed: 0,
  });

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('spendings')
      .onSnapshot(
        querySnapshot => {
          const spendingsByCategory: { [key: string]: number } = {};
          const categoryMap: { [key: string]: string } = {
            'Runcit': 'groceries',
            'Sewa': 'rent',
            'Perayaan': 'celebration',
            'Hiburan': 'entertainment',
            'Lain-Lain': 'others',
          };

          let monthlyTotal = 0;

          if (querySnapshot && !querySnapshot.empty) {
            querySnapshot.forEach(doc => {
              const spending = doc.data();
              const categoryName = spending.category;
              const amount = spending.amount;
              const docDate = spending?.date?.toDate ? spending.date.toDate() : new Date(spending?.date);

              const mappedCategoryName = Object.keys(categoryMap).find(key => categoryMap[key] === categoryName);

              if (mappedCategoryName) {
                if (spendingsByCategory[mappedCategoryName]) {
                  spendingsByCategory[mappedCategoryName] += amount;
                } else {
                  spendingsByCategory[mappedCategoryName] = amount;
                }
              }

              if (docDate >= startOfMonth && docDate <= endOfMonth) {
                monthlyTotal += amount;
              }
            });
          }

          console.log('Spendings by Category:', spendingsByCategory, 'Monthly Total:', monthlyTotal);

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
        },
        error => {
          console.error("Error fetching spendings: ", error);
        }
      );

    return () => unsubscribe();
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
      router.push(screenName as any);
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
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('spending.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.summaryContainer}>
          <Text style={[styles.summaryTitle, { fontSize: fontSize.large }]}>{t('spending.summary')}</Text>
          <Text style={[styles.totalSpendingText, { fontSize: fontSize.body }]}>{t('spending.label')}: -RM {summary.totalExpenses.toFixed(2)}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(summary.percentageUsed, 100).toFixed(0)}%` }]} />
            <Text style={[styles.progressPercentage, { fontSize: fontSize.small }]}>{summary.percentageUsed.toFixed(0)}%</Text>
          </View>
          <Text style={[styles.progressText, { fontSize: fontSize.small }]}>RM{summary.totalExpenses.toFixed(2)} / RM{budgetGoal.toFixed(2)}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('spending.popular')}</Text>
          <View style={styles.popularCategoriesContainer}>
            {popularCategories.map(category => (
              <TouchableOpacity key={category.name} style={styles.popularCategoryCard} onPress={() => handleCategoryPress(category.name)}>
                <Text style={[styles.popularCategoryIcon, { fontSize: fontSize.heading }]}>{category.icon}</Text>
                <Text style={[styles.popularCategoryName, { fontSize: fontSize.body }]}>{t(`spending.categories.${category.key}`)}</Text>
                <Text style={[styles.popularCategoryAmount, { fontSize: fontSize.small }]}>RM{category.monthlySpent.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('spending.all')}</Text>
          <View style={styles.allCategoriesContainer}>
            {otherCategories.map(category => (
              <TouchableOpacity key={category.name} style={styles.categoryCard} onPress={() => handleCategoryPress(category.name)}>
                <Text style={[styles.categoryIcon, { fontSize: fontSize.medium }]}>{category.icon} {t(`spending.categories.${category.key}`)}</Text>
                <Text style={[styles.categoryAmount, { fontSize: fontSize.large }]}>RM{category.monthlySpent.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/addCategory')}>
          <Text style={[styles.addButtonText, { fontSize: fontSize.medium }]}>+ {t('spending.addNew')}</Text>
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
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  totalSpendingText: {
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
    color: '#2D3748',
    position: 'absolute',
    right: 10,
  },
  progressText: {
    color: '#fff',
    marginTop: 5,
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
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
  },
  popularCategoryName: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  popularCategoryAmount: {
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
    fontWeight: 'bold',
  },
  categoryAmount: {
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
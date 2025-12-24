import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';
import { ProgressChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

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
  const [refreshing, setRefreshing] = useState(false);

  const fetchSpendingData = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    try {
      const querySnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .get();

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

          // Map legacy/Malay names to keys if needed, or use raw if matches
          const mappedCategoryName = Object.keys(categoryMap).find(key => categoryMap[key] === categoryName) || categoryName;

          // Note: This logic assumes 'categoryName' matches the 'key' or 'name' in our list.
          // Ideally we should match by ID or consistent key.
          // For now, we try to match the 'name' property in categoriesData.
          
          const targetCategory = categoriesData.find(c => c.name === categoryName || c.key === categoryName);
          const effectiveKey = targetCategory ? targetCategory.name : 'Lain-Lain'; // Fallback

          if (docDate >= startOfMonth && docDate <= endOfMonth) {
             if (spendingsByCategory[effectiveKey]) {
                spendingsByCategory[effectiveKey] += amount;
              } else {
                spendingsByCategory[effectiveKey] = amount;
              }
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

      const totalExpenses = monthlyTotal;

      setSummary({
        totalExpenses,
        percentageUsed: (totalExpenses / budgetGoal) * 100,
      });
    } catch (error) {
      console.error("Error fetching spendings: ", error);
    }
  }, []);

  useEffect(() => {
    fetchSpendingData();
  }, [fetchSpendingData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSpendingData();
    setRefreshing(false);
  }, [fetchSpendingData]);

  const handleCategoryPress = (categoryName: string) => {
    let screenName = '';
    switch (categoryName) {
      case 'Runcit': screenName = '/Runcit'; break;
      case 'Sewa': screenName = '/Sewa'; break;
      case 'Perayaan': screenName = '/Perayaan'; break;
      case 'Hiburan': screenName = '/Hiburan'; break;
      case 'Lain-Lain': screenName = '/LainLainSpending'; break;
      default: break;
    }
    if (screenName) {
      router.push(screenName as any);
    }
  };

  const popularCategories = categories.filter(c => c.isPopular);
  const otherCategories = categories.filter(c => !c.isPopular);

  // Budget Health Logic
  const getBudgetHealth = (percentage: number) => {
    if (percentage < 50) return { color: '#48BB78', label: t('spending.onTrack'), icon: 'check-circle' };
    if (percentage < 80) return { color: '#ECC94B', label: t('spending.warning'), icon: 'warning' };
    return { color: '#F56565', label: t('spending.critical'), icon: 'error' };
  };

  const budgetHealth = getBudgetHealth(summary.percentageUsed);
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 217, 168, ${opacity})`,
    strokeWidth: 2, 
  };
  
  const chartData = {
    labels: ["Used", "Left"], // optional
    data: [Math.min(summary.percentageUsed / 100, 1)]
  };

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysLeft = daysInMonth - daysPassed;
  const dailyAverage = summary.totalExpenses / (daysPassed || 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('spending.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D9A8" />
        }
      >
        {/* Enhanced Summary Card */}
        <View style={styles.summaryWrapper}>
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.summaryLabel, { fontSize: fontSize.medium }]}>{t('spending.summary')}</Text>
                        <Text style={[styles.summaryAmount, { fontSize: fontSize.heading }]} numberOfLines={1} adjustsFontSizeToFit>RM{summary.totalExpenses.toFixed(2)}</Text>
                        <View style={[styles.healthBadge, { backgroundColor: budgetHealth.color + '20' }]}>
                            <MaterialIcons name={budgetHealth.icon as any} size={14} color={budgetHealth.color} />
                            <Text style={[styles.healthText, { color: budgetHealth.color, fontSize: fontSize.small }]}> {budgetHealth.label}</Text>
                        </View>
                    </View>
                    <View style={styles.chartContainer}>
                        <ProgressChart
                            data={chartData}
                            width={80}
                            height={80}
                            strokeWidth={8}
                            radius={32}
                            chartConfig={chartConfig}
                            hideLegend={true}
                        />
                        <Text style={[styles.chartPercentage, { fontSize: fontSize.small }]}>{Math.min(summary.percentageUsed, 100).toFixed(0)}%</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { fontSize: fontSize.small }]}>{t('spending.dailyAverage')}</Text>
                        <Text style={[styles.statValue, { fontSize: fontSize.medium }]}>RM{dailyAverage.toFixed(2)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { fontSize: fontSize.small }]}>{t('spending.daysLeft')}</Text>
                        <Text style={[styles.statValue, { fontSize: fontSize.medium }]}>{daysLeft}</Text>
                    </View>
                </View>
            </View>
        </View>

        <View style={{ height: 20 }} /> {/* Extra spacing after card */}

        {/* Popular Categories - Horizontal Scroll */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('spending.popular')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {popularCategories.map(category => (
              <TouchableOpacity key={category.name} style={styles.popularCard} onPress={() => handleCategoryPress(category.name)}>
                <View style={[styles.iconCircle, { backgroundColor: category.color + '20' }]}>
                    <Text style={[styles.popularIcon, { fontSize: fontSize.large }]}>{category.icon}</Text>
                </View>
                <Text style={[styles.popularName, { fontSize: fontSize.medium }]} numberOfLines={1}>{t(`spending.categories.${category.key}`)}</Text>
                <Text style={[styles.popularAmount, { fontSize: fontSize.small }]}>RM{category.monthlySpent.toFixed(0)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* All Categories - Vertical List */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('spending.all')}</Text>
          <View style={styles.verticalList}>
            {otherCategories.map(category => {
                const percentOfTotal = summary.totalExpenses > 0 ? (category.monthlySpent / summary.totalExpenses) * 100 : 0;
                return (
                    <TouchableOpacity key={category.name} style={styles.listItem} onPress={() => handleCategoryPress(category.name)}>
                        <View style={styles.listItemLeft}>
                            <View style={[styles.listIconCircle, { backgroundColor: category.color + '20' }]}>
                                <Text style={{ fontSize: fontSize.medium }}>{category.icon}</Text>
                            </View>
                            <View>
                                <Text style={[styles.listName, { fontSize: fontSize.medium }]}>{t(`spending.categories.${category.key}`)}</Text>
                                <Text style={[styles.listPercent, { fontSize: fontSize.small }]}>{percentOfTotal.toFixed(1)}%</Text>
                            </View>
                        </View>
                        <View style={styles.listItemRight}>
                            <Text style={[styles.listAmount, { fontSize: fontSize.medium }]}>RM{category.monthlySpent.toFixed(2)}</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#CBD5E0" />
                        </View>
                    </TouchableOpacity>
                );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/addCategory')}>
          <Text style={[styles.addButtonText, { fontSize: fontSize.medium }]}>+ {t('spending.addNew')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/addSpending')}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC', // Slightly lighter gray for modern feel
  },
  header: {
    backgroundColor: '#00D9A8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerBtn: {
    padding: 5,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#fff',
  },
  container: {
    flex: 1,
  },
  summaryWrapper: {
    backgroundColor: '#00D9A8',
    paddingBottom: 40,
    paddingTop: 35, // Add top padding so card doesn't hit header
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -30, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#718096',
    fontWeight: '600',
  },
  summaryAmount: {
    fontWeight: '800',
    color: '#2D3748',
    marginVertical: 5,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  healthText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  chartPercentage: {
    position: 'absolute',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2D3748',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#A0AEC0',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
    color: '#4A5568',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30, // Increased bottom margin
    marginTop: 10, // Added top margin for spacing
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 15,
  },
  horizontalScroll: {
    paddingRight: 20,
    paddingVertical: 10, // Added vertical padding for shadow clearance
  },
  popularCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Increased shadow offset
    shadowOpacity: 0.08, // Increased opacity slightly
    shadowRadius: 8,
    elevation: 4, // Increased elevation
    alignItems: 'center',
    marginBottom: 5, // Extra margin for bottom shadow
    marginLeft:3
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  popularIcon: {
    textAlign: 'center',
  },
  popularName: {
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  popularAmount: {
    color: '#718096',
    fontWeight: '500',
  },
  verticalList: {
    gap: 12,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listName: {
    fontWeight: '600',
    color: '#2D3748',
  },
  listPercent: {
    color: '#A0AEC0',
    marginTop: 2,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listAmount: {
    fontWeight: '700',
    color: '#2D3748',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00D9A8',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#00D9A8',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 25,
    bottom: 25,
    backgroundColor: '#00D9A8',
    borderRadius: 30,
    shadowColor: '#00D9A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

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

  const popularCategories = [...categories].sort((a, b) => b.monthlySpent - a.monthlySpent).slice(0, 3);
  const otherCategories = [...categories].sort((a, b) => b.monthlySpent - a.monthlySpent).slice(3);

  // Budget Health Logic
  const getBudgetHealth = (percentage: number) => {
    if (percentage < 50) return { color: '#48BB78', label: t('spending.onTrack'), icon: 'check-circle' };
    if (percentage < 80) return { color: '#ECC94B', label: t('spending.warning'), icon: 'warning' };
    return { color: '#F56565', label: t('spending.critical'), icon: 'error' };
  };

  const budgetHealth = getBudgetHealth(summary.percentageUsed);

  // Chart Logic
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(72, 187, 120, ${opacity})`, // #48BB78 - Darker green for contrast
    strokeWidth: 2,
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#2F855A"
    }
  };

  const chartData = {
    labels: ["Used", "Left"],
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('spending.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48BB78" />
        }
      >
        {/* Enhanced Summary Card - Accessible Group */}
        <View style={styles.summaryWrapper}>
          <View
            style={styles.summaryCard}
            accessible={true}
            accessibilityLabel={`${t('spending.summary')}, ${t('spending.label')} RM${summary.totalExpenses.toFixed(2)}, ${budgetHealth.label}`}
          >
            <View style={styles.summaryHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.summaryLabel, { fontSize: fontSize.medium }]}>{t('spending.summary')}</Text>
                <Text style={[styles.summaryAmount, { fontSize: fontSize.heading }]}>
                  RM{summary.totalExpenses.toFixed(2)}
                </Text>
                <View style={[styles.healthBadge, { backgroundColor: budgetHealth.color + '20' }]}>
                  <MaterialIcons name={budgetHealth.icon as any} size={18} color={budgetHealth.color} />
                  <Text style={[styles.healthText, { color: budgetHealth.color, fontSize: fontSize.body }]}> {budgetHealth.label}</Text>
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
                <Text style={[styles.chartPercentage, { fontSize: fontSize.small }]}>
                  {Math.min(summary.percentageUsed, 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View
                style={styles.statItem}
                accessible={true}
                accessibilityLabel={`${t('spending.dailyAverage')}, RM${dailyAverage.toFixed(2)}`}
              >
                <Text style={[styles.statLabel, { fontSize: fontSize.small }]}>{t('spending.dailyAverage')}</Text>
                <Text style={[styles.statValue, { fontSize: fontSize.medium }]}>RM{dailyAverage.toFixed(2)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View
                style={styles.statItem}
                accessible={true}
                accessibilityLabel={`${t('spending.daysLeft')}, ${daysLeft}`}
              >
                <Text style={[styles.statLabel, { fontSize: fontSize.small }]}>{t('spending.daysLeft')}</Text>
                <Text style={[styles.statValue, { fontSize: fontSize.medium }]}>{daysLeft}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />

        {/* Popular Categories - Horizontal Scroll */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('spending.popular')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {popularCategories.map(category => (
              <TouchableOpacity
                key={category.name}
                style={styles.popularCard}
                onPress={() => handleCategoryPress(category.name)}
                accessible={true}
                accessibilityLabel={`${t(`spending.categories.${category.key}`)}, RM${category.monthlySpent.toFixed(0)}`}
                accessibilityRole="button"
              >
                <View style={[styles.iconCircle, { backgroundColor: category.color + '20' }]}>
                  <Text style={[styles.popularIcon, { fontSize: fontSize.xlarge }]}>{category.icon}</Text>
                </View>
                <Text style={[styles.popularName, { fontSize: fontSize.body }]} numberOfLines={2} ellipsizeMode="tail">
                  {t(`spending.categories.${category.key}`)}
                </Text>
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
                <TouchableOpacity
                  key={category.name}
                  style={styles.listItem}
                  onPress={() => handleCategoryPress(category.name)}
                  accessible={true}
                  accessibilityLabel={`${t(`spending.categories.${category.key}`)}, ${percentOfTotal.toFixed(1)}%, RM${category.monthlySpent.toFixed(2)}`}
                  accessibilityRole="button"
                >
                  <View style={[styles.listItemLeft, { flex: 1 }]}>
                    <View style={[styles.listIconCircle, { backgroundColor: category.color + '20' }]}>
                      <Text style={{ fontSize: fontSize.large }}>{category.icon}</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.listName, { fontSize: fontSize.medium, color: '#1A202C' }]}>
                        {t(`spending.categories.${category.key}`)}
                      </Text>
                      <Text style={[styles.listPercent, { fontSize: fontSize.small }]}>{percentOfTotal.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[styles.listAmount, { fontSize: fontSize.medium, color: '#1A202C' }]}>
                      RM{category.monthlySpent.toFixed(2)}
                    </Text>
                    <MaterialIcons name="chevron-right" size={24} color="#718096" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/addCategory')}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={[styles.addButtonText, { fontSize: fontSize.medium }]}>+ {t('spending.addNew')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/addSpending')}
        accessibilityLabel={t('spending.title')} // "Add Spending"
        accessibilityRole="button"
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#48BB78',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20, // Verify status bar handling
  },
  headerBtn: {
    padding: 8,
    borderRadius: 8, // Larger touch target visual
  },
  headerTitle: {
    fontWeight: '700',
    color: '#fff',
    flexShrink: 1, // Allow text to shrink if needed
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  summaryWrapper: {
    backgroundColor: '#48BB78',
    paddingBottom: 40,
    paddingTop: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24, // Increased padding
    marginHorizontal: 20,
    marginTop: -30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    // Removed fixed height to allow expansion
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
    color: '#4A5568', // Darker grey for contrast
    fontWeight: '600',
  },
  summaryAmount: {
    fontWeight: '800',
    color: '#1A202C', // Almost black
    marginVertical: 8,
    flexWrap: 'wrap', // Allow wrapping for huge numbers
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // Larger touch/visual area
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  healthText: {
    fontWeight: '700',
    marginLeft: 6,
  },
  chartPercentage: {
    position: 'absolute',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1A202C',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
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
    color: '#718096', // Darker than previous A0AEC0
    marginBottom: 6,
  },
  statValue: {
    fontWeight: '700',
    color: '#2D3748',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: '800', // Highly readable
    color: '#1A202C',
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingRight: 20,
    paddingVertical: 10,
  },
  popularCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 130, // Slightly wider for larger text
    minHeight: 140, // Ensure height for text updates
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    marginBottom: 5,
    marginLeft: 3,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56, // Larger icon area
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  popularIcon: {
    textAlign: 'center',
  },
  popularName: {
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 6,
    textAlign: 'center',
  },
  popularAmount: {
    color: '#4A5568',
    fontWeight: '600',
  },
  verticalList: {
    gap: 16, // More spacing between items
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20, // Larger visual padding
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    minHeight: 80, // Minimum height for touch target
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listName: {
    fontWeight: '600',
    // color set inline
  },
  listPercent: {
    color: '#718096',
    marginTop: 4,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listAmount: {
    fontWeight: '700',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#fff',
    borderWidth: 2, // Thicker border
    borderColor: '#48BB78',
    borderRadius: 16,
    paddingVertical: 18, // Taller button
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#48BB78',
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    width: 64, // Larger FAB
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    right: 25,
    bottom: 30,
    backgroundColor: '#48BB78',
    borderRadius: 32,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100, // Ensure on top
  },
});

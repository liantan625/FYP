import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get("window").width;

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  assetName?: string;
  spendingName?: string;
  createdAt: any;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t, i18n } = useTranslation();

  const dateLocales: { [key: string]: string } = {
    ms: 'ms-MY',
    zh: 'zh-CN',
    ta: 'ta-IN',
    en: 'en-US'
  };
  const dateLocale = dateLocales[i18n.language] || 'en-US';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ labels: string[]; income: number[]; expense: number[] }>({
    labels: [],
    income: [],
    expense: [],
  });

  const fetchData = () => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const assetsUnsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('assets')
      .onSnapshot(assetsSnapshot => {
        if (!assetsSnapshot) return;
        const assets = assetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'income' as const
        }));
        const totalAssets = assets.reduce((sum, asset: any) => sum + (asset.amount || 0), 0);
        const totalIncome = assets.filter((asset: any) => asset.category === 'income')
          .reduce((sum, asset: any) => sum + (asset.amount || 0), 0);

        const spendingsUnsubscribe = firestore()
          .collection('users')
          .doc(user.uid)
          .collection('spendings')
          .onSnapshot(spendingsSnapshot => {
            if (!spendingsSnapshot) return;
            const spendings = spendingsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              type: 'expense' as const
            }));
            const totalExpenses = spendings.reduce((sum, spending: any) => sum + (spending.amount || 0), 0);

            // Build expense breakdown
            const expenseBreakdownMap = new Map<string, number>();
            spendings.forEach((spending: any) => {
              // Normalize category key to lowercase for translation
              const categoryKey = spending.category ? spending.category.toLowerCase() : 'others';
              const categoryName = t(`transactions.${categoryKey}`, { defaultValue: spending.category });
              expenseBreakdownMap.set(
                categoryName,
                (expenseBreakdownMap.get(categoryName) || 0) + (spending.amount || 0)
              );
            });

            const colors = ['#48BB78', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
            let colorIndex = 0;
            const newExpenseBreakdown = Array.from(expenseBreakdownMap, ([name, amount]) => ({
              name,
              population: amount,
              color: colors[colorIndex++ % colors.length],
              legendFontSize: 0, // We use custom legend
            })).sort((a, b) => b.population - a.population);

            // Calculate monthly trend (last 6 months)
            const now = new Date();
            const monthLabels: string[] = [];
            const incomeByMonth: number[] = [];
            const expenseByMonth: number[] = [];

            for (let i = 5; i >= 0; i--) {
              const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
              const monthLabel = monthDate.toLocaleDateString(dateLocale, { month: 'short' });
              monthLabels.push(monthLabel);

              const monthIncome = assets
                .filter((a: any) => {
                  if (!a.createdAt) return false;
                  const date = a.createdAt.toDate();
                  return date >= monthDate && date <= monthEnd;
                })
                .reduce((sum, a: any) => sum + (a.amount || 0), 0);

              const monthExpense = spendings
                .filter((s: any) => {
                  if (!s.createdAt) return false;
                  const date = s.createdAt.toDate();
                  return date >= monthDate && date <= monthEnd;
                })
                .reduce((sum, s: any) => sum + (s.amount || 0), 0);

              incomeByMonth.push(monthIncome);
              expenseByMonth.push(monthExpense);
            }

            setMonthlyData({ labels: monthLabels, income: incomeByMonth, expense: expenseByMonth });
            setSummary({ totalAssets: totalAssets + totalIncome, totalIncome, totalExpenses });
            setExpenseBreakdown(newExpenseBreakdown);

            const translatedTransactions = [...assets, ...spendings]
              .map((item: any) => {
                const categoryKey = item.category ? item.category.toLowerCase() : 'others';
                return {
                  ...item,
                  category: t(`transactions.${categoryKey}`, { defaultValue: item.category })
                };
              })
              .filter((item: any) => item.createdAt)
              .sort((a: any, b: any) => b.createdAt.toDate() - a.createdAt.toDate())
              .slice(0, 10); // Show only last 10 transactions

            setTransactions(translatedTransactions as Transaction[]);
            setLoading(false);
          });

        return () => spendingsUnsubscribe();
      });

    return () => assetsUnsubscribe();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate insights
  const savingsRate = useMemo(() => {
    if (summary.totalIncome === 0) return 0;
    return ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100;
  }, [summary]);

  const topCategory = useMemo(() => {
    if (expenseBreakdown.length === 0) return null;
    return expenseBreakdown[0];
  }, [expenseBreakdown]);

  const netCashFlow = summary.totalIncome - summary.totalExpenses;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48BB78" />
          <Text style={[styles.loadingText, { fontSize: fontSize.medium }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]} accessibilityRole="header">
          {t('transactions.headerTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48BB78" />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}
            accessible={true}
            accessibilityLabel={`${t('transactions.income')}, RM ${summary.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          >
            <View style={styles.summaryIconContainer}>
              <MaterialIcons name="trending-up" size={22} color="#48BB78" />
            </View>
            <Text style={[styles.summaryLabel, { fontSize: fontSize.small }]}>{t('transactions.income')}</Text>
            <Text style={[styles.summaryAmount, { fontSize: fontSize.medium, color: '#166534' }]}>
              RM {summary.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View
            style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}
            accessible={true}
            accessibilityLabel={`${t('transactions.expensesChartTitle')}, RM ${summary.totalExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          >
            <View style={styles.summaryIconContainer}>
              <MaterialIcons name="trending-down" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.summaryLabel, { fontSize: fontSize.small }]}>{t('transactions.expensesChartTitle')}</Text>
            <Text style={[styles.summaryAmount, { fontSize: fontSize.medium, color: '#B91C1C' }]}>
              RM {summary.totalExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Net Cash Flow Card */}
        <View
          style={styles.cashFlowCard}
          accessible={true}
          accessibilityLabel={`${t('transactions.total')}, ${netCashFlow >= 0 ? '+' : ''} RM ${netCashFlow.toLocaleString('en-MY', { minimumFractionDigits: 2 })}. ${t('report.savingsRate')}: ${savingsRate.toFixed(1)}%. ${topCategory ? `${t('report.topSpending')}: ${topCategory.name}` : ''}`}
        >
          <View style={styles.cashFlowHeader}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#48BB78" />
            <Text style={[styles.cashFlowTitle, { fontSize: fontSize.medium }]}>
              {t('transactions.total')}
            </Text>
          </View>
          <Text style={[
            styles.cashFlowAmount,
            { fontSize: fontSize.xlarge, color: netCashFlow >= 0 ? '#166534' : '#B91C1C' }
          ]}>
            {netCashFlow >= 0 ? '+' : ''}RM {netCashFlow.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.insightRow}>
            <View style={styles.insightItem}>
              <Text style={[styles.insightLabel, { fontSize: fontSize.small }]}>
                {t('report.savingsRate')}
              </Text>
              <Text style={[
                styles.insightValue,
                { fontSize: fontSize.medium, color: savingsRate >= 20 ? '#15803d' : '#b45309' }
              ]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
            {topCategory && (
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { fontSize: fontSize.small }]}>
                  {t('report.topSpending')}
                </Text>
                <Text style={[styles.insightValue, { fontSize: fontSize.medium, color: '#1F2937' }]}>
                  {topCategory.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Monthly Trend Chart */}
        {monthlyData.labels.length > 0 && (
          <View style={styles.chartCard} accessible={true} accessibilityLabel={t('report.monthlyTrend')}>
            <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>
              {t('report.financialTrend')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              <BarChart
                data={{
                  labels: monthlyData.labels,
                  datasets: [
                    {
                      data: monthlyData.expense.map(v => v || 0.01),
                      color: () => '#EF4444',
                    },
                  ],
                }}
                width={Math.max(screenWidth * 1.2, monthlyData.labels.length * 80)}
                height={220}
                yAxisLabel="RM"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                  labelColor: () => '#475569',
                  barPercentage: 0.5,
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#E2E8F0',
                  },
                  propsForLabels: {
                    fontSize: 10,
                  },
                }}
                style={styles.chartScrollable}
                showValuesOnTopOfBars={false}
                fromZero
              />
            </ScrollView>
          </View>
        )}

        {/* Expense Breakdown Pie Chart */}
        {expenseBreakdown.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>
              {t('report.expenseBreakdown')}
            </Text>
            <View style={styles.pieChartContainer}>
              <PieChart
                data={expenseBreakdown}
                width={screenWidth - 48} // Adjusted width padding
                height={180}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute={false} // Removed absolute to avoid text clutter on pie chart
                hasLegend={false}
              />
            </View>
            <View style={styles.legendContainer}>
              {expenseBreakdown.map((item, index) => {
                const percentage = summary.totalExpenses > 0
                  ? ((item.population / summary.totalExpenses) * 100).toFixed(1)
                  : '0';
                return (
                  <View
                    key={index}
                    style={styles.legendItem}
                    accessible={true}
                    accessibilityLabel={`${item.name}, ${percentage}%, RM ${item.population.toFixed(0)}`}
                  >
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { fontSize: fontSize.small }]}>{item.name}</Text>
                    <Text style={[styles.legendPercent, { fontSize: fontSize.small }]}>{percentage}%</Text>
                    <Text style={[styles.legendAmount, { fontSize: fontSize.small }]}>
                      RM {item.population.toFixed(0)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>
            {t('transactions.transactionsListTitle')}
          </Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color="#CBD5E1" />
              <Text style={[styles.emptyText, { fontSize: fontSize.medium }]}>
                {t('transactions.noTransactions')}
              </Text>
            </View>
          ) : (
            transactions.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={styles.transactionCard}
                onPress={() => Alert.alert(item.category, `${t('transactions.total')}: RM ${item.amount.toFixed(2)}`)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`${item.type === 'income' ? item.assetName : item.spendingName}, ${item.category}, ${item.type === 'income' ? '+' : '-'} RM ${item.amount.toFixed(2)}, ${item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('en-GB') : ''}`}
                accessibilityRole="button"
              >
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: item.type === 'income' ? '#E8F5E9' : '#FEE2E2' }
                ]}>
                  <MaterialIcons
                    name={item.type === 'income' ? 'arrow-upward' : 'arrow-downward'}
                    size={24}
                    color={item.type === 'income' ? '#166534' : '#B91C1C'}
                  />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={[styles.transactionName, { fontSize: fontSize.medium }]}>
                    {item.type === 'income' ? item.assetName : item.spendingName}
                  </Text>
                  <Text style={[styles.transactionCategory, { fontSize: fontSize.small }]}>
                    {item.category}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { fontSize: fontSize.medium, color: item.type === 'income' ? '#166534' : '#B91C1C' }
                  ]}>
                    {item.type === 'income' ? '+' : '-'}RM {item.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.transactionDate, { fontSize: fontSize.small }]}>
                    {item.createdAt
                      ? new Date(item.createdAt.toDate()).toLocaleDateString('en-GB')
                      : t('transactions.na')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    width: 48, // Minimum touch target 48dp
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 100, // Ensure minimum height for expanding content
    justifyContent: 'center',
  },
  summaryIconContainer: {
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#475569', // Darker grey for better contrast
    marginBottom: 4,
  },
  summaryAmount: {
    fontWeight: '700',
  },
  cashFlowCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cashFlowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cashFlowTitle: {
    fontWeight: '600',
    color: '#475569',
    marginLeft: 8,
  },
  cashFlowAmount: {
    fontWeight: '700',
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  insightItem: {
    flex: 1,
  },
  insightLabel: {
    color: '#64748B',
    marginBottom: 4,
  },
  insightValue: {
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  chartScrollable: {
    borderRadius: 12,
    marginLeft: 0,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap', // Allow wrapping for large text
  },
  legendColor: {
    width: 16, // Larger color indicator
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    color: '#1F2937',
    marginRight: 8,
  },
  legendPercent: {
    color: '#475569',
    marginRight: 12,
    minWidth: 40,
  },
  legendAmount: {
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 80,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    color: '#1F2937',
    flex: 1,
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryAmount: {
    fontWeight: '600',
    color: '#1F2937',
    width: 70,
    textAlign: 'right',
  },
  transactionsSection: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#94A3B8',
    marginTop: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16, // Increased padding
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    minHeight: 72, // Ensure minimum height
  },
  transactionIcon: {
    width: 48, // Increased size
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionContent: {
    flex: 1,
    marginRight: 8,
  },
  transactionName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionCategory: {
    color: '#475569', // Darker grey
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#64748B',
  },
});
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get('window').width;

const categoryDetails = {
  'groceries': { icon: '🛒', subtextKey: 'category.groceries', color: '#fce7f3', chartColor: '#FF9F43', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'rent': { icon: '🏠', subtextKey: 'category.rent', color: '#fef3c7', chartColor: '#54A0FF', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'celebration': { icon: '🎁', subtextKey: 'category.celebration', color: '#e0e7ff', chartColor: '#5F27CD', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'entertainment': { icon: '🎉', subtextKey: 'category.entertainment', color: '#dbeafe', chartColor: '#FF6B6B', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'others': { icon: '🤷', subtextKey: 'category.others', color: '#f3f4f6', chartColor: '#8395A7', legendFontColor: '#7F7F7F', legendFontSize: 12 },
};

const epfSavingsData: { [key: number]: { basic: number; adequate: number; enhanced: number } } = {
  18: { basic: 1400, adequate: 1500, enhanced: 2500 },
  19: { basic: 1700, adequate: 1800, enhanced: 3100 },
  20: { basic: 2200, adequate: 2300, enhanced: 3900 },
  21: { basic: 2800, adequate: 3000, enhanced: 5000 },
  22: { basic: 5800, adequate: 6400, enhanced: 10800 },
  23: { basic: 9200, adequate: 10100, enhanced: 16700 },
  24: { basic: 12300, adequate: 14100, enhanced: 24300 },
  25: { basic: 15900, adequate: 19000, enhanced: 30700 },
  26: { basic: 19800, adequate: 23400, enhanced: 40900 },
  27: { basic: 23800, adequate: 28600, enhanced: 51200 },
  28: { basic: 28300, adequate: 34500, enhanced: 62800 },
  29: { basic: 33000, adequate: 40700, enhanced: 72800 },
  30: { basic: 38000, adequate: 47500, enhanced: 85400 },
  31: { basic: 43400, adequate: 54800, enhanced: 99100 },
  32: { basic: 49100, adequate: 62700, enhanced: 114000 },
  33: { basic: 55100, adequate: 71200, enhanced: 129000 },
  34: { basic: 61400, adequate: 80300, enhanced: 147000 },
  35: { basic: 68100, adequate: 90000, enhanced: 165000 },
  36: { basic: 75100, adequate: 100000, enhanced: 185000 },
  37: { basic: 82600, adequate: 111000, enhanced: 206000 },
  38: { basic: 90400, adequate: 123000, enhanced: 229000 },
  39: { basic: 98600, adequate: 136000, enhanced: 253000 },
  40: { basic: 107000, adequate: 149000, enhanced: 279000 },
  41: { basic: 116000, adequate: 164000, enhanced: 305000 },
  42: { basic: 125000, adequate: 179000, enhanced: 336000 },
  43: { basic: 135000, adequate: 195000, enhanced: 368000 },
  44: { basic: 145000, adequate: 213000, enhanced: 402000 },
  45: { basic: 156000, adequate: 231000, enhanced: 438000 },
  46: { basic: 167000, adequate: 250000, enhanced: 476000 },
  47: { basic: 179000, adequate: 271000, enhanced: 516000 },
  48: { basic: 191000, adequate: 292000, enhanced: 559000 },
  49: { basic: 204000, adequate: 315000, enhanced: 606000 },
  50: { basic: 217000, adequate: 339000, enhanced: 652000 },
  51: { basic: 231000, adequate: 364000, enhanced: 703000 },
  52: { basic: 246000, adequate: 390000, enhanced: 757000 },
  53: { basic: 261000, adequate: 417000, enhanced: 813000 },
  54: { basic: 277000, adequate: 446000, enhanced: 873000 },
  55: { basic: 294000, adequate: 476000, enhanced: 935000 },
  56: { basic: 312000, adequate: 508000, enhanced: 1000000 },
  57: { basic: 330000, adequate: 541000, enhanced: 1070000 },
  58: { basic: 349000, adequate: 576000, enhanced: 1140000 },
  59: { basic: 369000, adequate: 612000, enhanced: 1220000 },
  60: { basic: 390000, adequate: 650000, enhanced: 1300000 },
};

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [totalAssets, setTotalAssets] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any>({
    labels: [],
    datasets: [{ data: [0] }, { data: [0] }]
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const allAssetsUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .onSnapshot(
          assetsSnapshot => {
            let total = 0;
            if (assetsSnapshot && !assetsSnapshot.empty) {
              assetsSnapshot.forEach(doc => {
                const data = doc.data();
                const amount = parseFloat(data?.amount) || 0;
                total += amount;
              });
            }
            console.log('Report - Total Assets:', total);
            setTotalAssets(total);
          },
          error => console.error("Error fetching all assets: ", error)
        );

      const monthlyIncomeUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .where('category', '==', 'income')
        .onSnapshot(
          assetsSnapshot => {
            let totalIncome = 0;
            if (assetsSnapshot && !assetsSnapshot.empty) {
              assetsSnapshot.forEach(doc => {
                const data = doc.data();
                const docDate = data?.date?.toDate ? data.date.toDate() : new Date(data?.date);
                // Check if the asset is from this month
                if (docDate >= startOfMonth && docDate <= endOfMonth) {
                  const amount = parseFloat(data?.amount) || 0;
                  totalIncome += amount;
                }
              });
            }
            console.log('Report - Monthly Income:', totalIncome);
            setIncome(totalIncome);
          },
          error => console.error("Error fetching monthly income: ", error)
        );

      const spendingsUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .onSnapshot(
          spendingsSnapshot => {
            let totalExpenses = 0;
            const expenseBreakdownMap = new Map();
            if (spendingsSnapshot && !spendingsSnapshot.empty) {
              spendingsSnapshot.forEach(doc => {
                const spending = doc.data();
                const docDate = spending?.date?.toDate ? spending.date.toDate() : new Date(spending?.date);
                // Check if the spending is from this month
                if (docDate >= startOfMonth && docDate <= endOfMonth) {
                  const amount = parseFloat(spending?.amount) || 0;
                  totalExpenses += amount;
                  const categoryKey = spending.category;
                  if (expenseBreakdownMap.has(categoryKey)) {
                    expenseBreakdownMap.set(categoryKey, expenseBreakdownMap.get(categoryKey) + amount);
                  } else {
                    expenseBreakdownMap.set(categoryKey, amount);
                  }
                }
              });
            }
            console.log('Report - Total Expenses:', totalExpenses);
            setExpenses(totalExpenses);

            const categories = Array.from(expenseBreakdownMap, ([key, amount]) => {
              const details = (categoryDetails as any)[key] || { icon: '❓', subtextKey: '', color: '#eee', chartColor: '#ccc', legendFontColor: '#7F7F7F', legendFontSize: 12 };
              return {
                name: t(`category.${key}`),
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
                ...details,
                subtext: details.subtextKey ? t(details.subtextKey) : ''
              };
            });
            setExpenseCategories(categories);
          },
          error => console.error("Error fetching spendings: ", error)
        );

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const fetchTrendData = async () => {
        try {
          const incomeSnapshot = await firestore()
            .collection('users')
            .doc(user.uid)
            .collection('assets')
            .where('date', '>=', sixMonthsAgo)
            .where('category', '==', 'income')
            .get();

          const expenseSnapshot = await firestore()
            .collection('users')
            .doc(user.uid)
            .collection('spendings')
            .where('date', '>=', sixMonthsAgo)
            .get();

          const monthlyData = new Map();
          for (let i = 0; i < 6; i++) {
            const d = new Date(sixMonthsAgo);
            d.setMonth(d.getMonth() + i);
            const key = d.toLocaleString('default', { month: 'short' });
            monthlyData.set(key, { income: 0, expense: 0 });
          }

          incomeSnapshot.forEach(doc => {
            const date = doc.data().date.toDate();
            const key = date.toLocaleString('default', { month: 'short' });
            if (monthlyData.has(key)) {
              const current = monthlyData.get(key);
              monthlyData.set(key, { ...current, income: current.income + doc.data().amount });
            }
          });

          expenseSnapshot.forEach(doc => {
            const date = doc.data().date.toDate();
            const key = date.toLocaleString('default', { month: 'short' });
            if (monthlyData.has(key)) {
              const current = monthlyData.get(key);
              monthlyData.set(key, { ...current, expense: current.expense + doc.data().amount });
            }
          });

          const labels = Array.from(monthlyData.keys());
          const incomeData = Array.from(monthlyData.values()).map((d: any) => d.income);
          const expenseData = Array.from(monthlyData.values()).map((d: any) => d.expense);

          console.log('Chart Labels:', labels);
          console.log('Income Data:', incomeData);
          console.log('Expense Data:', expenseData);

          setTrendData({
            labels,
            datasets: [
              { data: incomeData, color: (opacity = 1) => `rgba(0, 217, 168, ${opacity})`, strokeWidth: 2 },
              { data: expenseData, color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`, strokeWidth: 2 }
            ],
            legend: [t('report.income'), t('report.expense')]
          });

        } catch (error) {
          console.error("Error fetching trend data:", error);
        }
      };

      fetchTrendData();

      const fetchUserAge = async () => {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData && userData.age) {
              setUserAge(userData.age);
            }
          }
        } catch (error) {
          console.error("Error fetching user age:", error);
        }
      };

      fetchUserAge();

      return () => {
        allAssetsUnsubscribe();
        monthlyIncomeUnsubscribe();
        spendingsUnsubscribe();
      };
    }
  }, [t]);

  const generatePDF = async () => {
    try {
      setIsGeneratingPdf(true);

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
              h1 { color: #4CAF50; text-align: center; }
              h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
              .summary-card { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .label { font-weight: bold; color: #666; }
              .value { font-weight: bold; }
              .income { color: #4CAF50; }
              .expense { color: #F44336; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>DuitU ${t('report.title')}</h1>
            <p>${t('report.thisMonth')}: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            
            <div class="summary-card">
              <h2>${t('report.smartAnalysis')}</h2>
              <div class="row">
                <span class="label">${t('report.income')}:</span>
                <span class="value income">RM ${income.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="label">${t('report.expense')}:</span>
                <span class="value expense">RM ${expenses.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="label">${t('report.savingsRate')}:</span>
                <span class="value">${((income - expenses) / income * 100).toFixed(1)}%</span>
              </div>
            </div>

            <h2>${t('report.expenseBreakdown')}</h2>
            <table>
              <tr>
                <th>${t('report.category')}</th>
                <th>${t('report.amount')}</th>
                <th>%</th>
              </tr>
              ${expenseCategories.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>RM ${item.amount.toFixed(2)}</td>
                  <td>${item.percentage.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </table>

            <h2>${t('report.monthlyTrend')}</h2>
            <table>
              <tr>
                <th>${t('report.month')}</th>
                <th>${t('report.income')}</th>
                <th>${t('report.expense')}</th>
              </tr>
              ${trendData.labels.map((label: string, index: number) => `
                <tr>
                  <td>${label}</td>
                  <td>RM ${trendData.datasets[0].data[index].toFixed(2)}</td>
                  <td>RM ${trendData.datasets[1].data[index].toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

      Alert.alert(t('report.pdfSaved'), t('report.pdfSavedMessage', { path: uri }));

    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(t('report.pdfFailed'), (error as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const topCategory = expenseCategories.length > 0
    ? expenseCategories.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('report.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.contentBody}>
          <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.balanceLabel, { color: colors.text, opacity: 0.7 }]}>
              {t('report.retirementAssets')}
            </Text>
            <Text style={[styles.balanceAmount, { color: '#10b981' }]}>
              RM {totalAssets.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <View style={styles.summaryIconContainer}>
                <Text style={styles.summaryIcon}>💰</Text>
              </View>
              <Text style={styles.summaryLabel}>{t('report.income')}</Text>
              <Text style={styles.summaryAmount}>RM {income.toFixed(2)}</Text>
              <View style={styles.summaryChange}>
                <Text style={styles.summaryChangeText}>{t('report.thisMonth')}</Text>
              </View>
            </View>

            <View style={[styles.summaryCard, styles.expenseCard]}>
              <View style={styles.summaryIconContainer}>
                <Text style={styles.summaryIcon}>💳</Text>
              </View>
              <Text style={styles.summaryLabel}>{t('report.expense')}</Text>
              <Text style={styles.summaryAmount}>RM {expenses.toFixed(2)}</Text>
              <View style={styles.summaryChange}>
                <Text style={styles.summaryChangeText}>{t('report.thisMonth')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('report.financialTrend')}
            </Text>
          </View>
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            {trendData.labels.length > 0 ? (
              <LineChart
                data={trendData}
                width={screenWidth - 80}
                height={220}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#ffa726" }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            ) : (
              <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>{t('report.loadingTrend')}</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('report.smartAnalysis')}
            </Text>
          </View>
          <View style={styles.insightsGrid}>
            <View style={[styles.insightCard, { backgroundColor: '#e0f2fe' }]}>
              <Text style={styles.insightLabel}>{t('report.savingsRate')}</Text>
              <Text style={styles.insightValue}>{savingsRate.toFixed(1)}%</Text>
              <Text style={styles.insightSubtext}>
                {savingsRate >= 20 ? t('report.greatJob') : t('report.improveSavings')}
              </Text>
            </View>
            {topCategory && (
              <View style={[styles.insightCard, { backgroundColor: '#fce7f3' }]}>
                <Text style={styles.insightLabel}>{t('report.topSpending')}</Text>
                <Text style={styles.insightValue}>{topCategory.name}</Text>
                <Text style={styles.insightSubtext}>
                  RM {topCategory.amount.toFixed(0)} ({topCategory.percentage.toFixed(0)}%)
                </Text>
              </View>
            )}
          </View>

          {userAge && epfSavingsData[userAge] && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('report.epfComparison')}
                </Text>
              </View>
              <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                <BarChart
                  data={{
                    labels: [t('report.basic'), t('report.adequate'), t('report.enhanced')],
                    datasets: [
                      {
                        data: [
                          epfSavingsData[userAge].basic,
                          epfSavingsData[userAge].adequate,
                          epfSavingsData[userAge].enhanced,
                        ],
                      },
                    ],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                  }}
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('report.expenseBreakdown')}
            </Text>
          </View>

          <View style={[styles.categoriesCard, { backgroundColor: colors.card }]}>
            {expenseCategories.length > 0 ? (
              <View style={{ alignItems: 'center', marginRight: 10 }}>
                <PieChart
                  data={expenseCategories.map((c: any) => ({
                    name: c.name,
                    amount: c.amount,
                    color: c.chartColor,
                    legendFontColor: c.legendFontColor,
                    legendFontSize: 10
                  }))}
                  width={screenWidth - 100}  // Increased width to prevent legend cutoff
                  height={160}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor={"amount"}
                  backgroundColor={"transparent"}
                  paddingLeft={"35"}
                  center={[-15, 0]}
                  absolute
                  hasLegend={true}
                />
              </View>
            ) : (
              <Text style={{ textAlign: 'center', padding: 20, color: '#999' }}>{t('report.noExpenseData')}</Text>
            )}

            <View style={styles.divider} />

            {expenseCategories.map((category: any, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity style={styles.categoryItem} activeOpacity={0.7}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Text style={styles.categoryEmoji}>{category.icon}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {category.name}
                      </Text>
                      <Text style={[styles.categorySubtext, { color: colors.text, opacity: 0.6 }]}>
                        {category.subtext}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={[styles.categoryAmount, { color: colors.text }]}>
                      RM {category.amount.toFixed(2)}
                    </Text>
                    <Text style={[styles.categoryPercentage, { color: colors.text, opacity: 0.6 }]}>
                      {category.percentage.toFixed(0)}%
                    </Text>
                  </View>
                </TouchableOpacity>
                {index < expenseCategories.length - 1 && <View style={styles.categoryDivider} />}
              </React.Fragment>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={generatePDF}
            disabled={isGeneratingPdf}
          >
          
            {isGeneratingPdf ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.exportButtonText}>{t('report.exportPdf')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: '#10b981', marginTop: 12 }]}
            onPress={() => {}}
          >
            <Text style={styles.exportButtonText}>Eksport Sebagai CSV</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  incomeCard: {
    backgroundColor: '#dcfce7',
  },
  expenseCard: {
    backgroundColor: '#fee2e2',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#1e293b',
    opacity: 0.7,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryChange: {
    marginTop: 4,
  },
  summaryChangeText: {
    fontSize: 11,
    color: '#1e293b',
    opacity: 0.6,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoriesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categorySubtext: {
    fontSize: 13,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
  },
  categoryDivider: {
    height: 1,
    backgroundColor: '#e8ecef',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8ecef',
    marginVertical: 15,
  },
  exportButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  insightCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 11,
    color: '#4b5563',
    opacity: 0.8,
  },
});
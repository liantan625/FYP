import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PieChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const categoryTranslations = {
  'groceries': 'Runcit',
  'rent': 'Sewa',
  'celebration': 'Perayaan',
  'entertainment': 'Hiburan',
  'others': 'Lain-Lain',
  'income': 'Pendapatan',
  'investment': 'Pelaburan',
  'property': 'Hartanah',
  'bank': 'Simpanan Bank'
};

const categoryDetails = {
  'Runcit': { icon: '🛒', subtext: 'Makanan & Keperluan', color: '#fce7f3', chartColor: '#FF9F43', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'Sewa': { icon: '🏠', subtext: 'Utiliti & Perumahan', color: '#fef3c7', chartColor: '#54A0FF', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'Perayaan': { icon: '🎁', subtext: 'Hadiah & Sambutan', color: '#e0e7ff', chartColor: '#5F27CD', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'Hiburan': { icon: '🎉', subtext: 'Rekreasi & Santai', color: '#dbeafe', chartColor: '#FF6B6B', legendFontColor: '#7F7F7F', legendFontSize: 12 },
  'Lain-Lain': { icon: '🤷', subtext: 'Lain-lain', color: '#f3f4f6', chartColor: '#8395A7', legendFontColor: '#7F7F7F', legendFontSize: 12 },
};

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [totalAssets, setTotalAssets] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }, { data: [] }]
  });

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // 1. Fetch Total Assets (Retirement Assets)
      const allAssetsUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .onSnapshot(
          assetsSnapshot => {
            let total = 0;
            if (assetsSnapshot) {
              assetsSnapshot.forEach(doc => {
                total += doc.data().amount;
              });
            }
            setTotalAssets(total);
          },
          error => console.error("Error fetching all assets: ", error)
        );

      // 2. Fetch Current Month Income
      const monthlyIncomeUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .where('category', '==', 'income')
        .onSnapshot(
          assetsSnapshot => {
            let totalIncome = 0;
            if (assetsSnapshot) {
              assetsSnapshot.forEach(doc => {
                totalIncome += doc.data().amount;
              });
            }
            setIncome(totalIncome);
          },
          error => console.error("Error fetching monthly income: ", error)
        );

      // 3. Fetch Current Month Expenses & Categories
      const spendingsUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .onSnapshot(
          spendingsSnapshot => {
            let totalExpenses = 0;
            const expenseBreakdownMap = new Map();
            if (spendingsSnapshot) {
              spendingsSnapshot.forEach(doc => {
                const spending = doc.data();
                totalExpenses += spending.amount;
                const categoryName = (categoryTranslations as any)[spending.category] || spending.category;
                if (expenseBreakdownMap.has(categoryName)) {
                  expenseBreakdownMap.set(categoryName, expenseBreakdownMap.get(categoryName) + spending.amount);
                } else {
                  expenseBreakdownMap.set(categoryName, spending.amount);
                }
              });
            }
            setExpenses(totalExpenses);

            const categories = Array.from(expenseBreakdownMap, ([name, amount]) => ({
              name,
              amount,
              percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
              ...((categoryDetails as any)[name] || { icon: '❓', subtext: '', color: '#eee', chartColor: '#ccc', legendFontColor: '#7F7F7F', legendFontSize: 12 })
            }));
            setExpenseCategories(categories);
          },
          error => console.error("Error fetching spendings: ", error)
        );

      // 4. Fetch 6-Month Trend Data
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
          // Initialize last 6 months
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

          setTrendData({
            labels,
            datasets: [
              { data: incomeData, color: (opacity = 1) => `rgba(0, 217, 168, ${opacity})`, strokeWidth: 2 }, // Income - Brand Teal #00D9A8
              { data: expenseData, color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`, strokeWidth: 2 } // Expense - Vibrant Red #FF5252
            ],
            legend: ["Pendapatan", "Perbelanjaan"]
          });

        } catch (error) {
          console.error("Error fetching trend data:", error);
        }
      };

      fetchTrendData();

      return () => {
        allAssetsUnsubscribe();
        monthlyIncomeUnsubscribe();
        spendingsUnsubscribe();
      };
    }
  }, []);

  const getTrendChartUrl = () => {
    const chartConfig = {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: 'Pendapatan',
            borderColor: '#00D9A8',
            backgroundColor: 'rgba(0, 217, 168, 0.1)',
            data: trendData.datasets[0].data,
            fill: false,
          },
          {
            label: 'Perbelanjaan',
            borderColor: '#FF5252',
            backgroundColor: 'rgba(255, 82, 82, 0.1)',
            data: trendData.datasets[1].data,
            fill: false,
          },
        ],
      },
      options: {
        legend: { display: true },
        title: { display: true, text: 'Trend Kewangan 6 Bulan' },
      },
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`;
  };

  const getPieChartUrl = () => {
    const chartConfig = {
      type: 'pie',
      data: {
        labels: expenseCategories.map((c: any) => c.name),
        datasets: [
          {
            data: expenseCategories.map((c: any) => c.amount),
            backgroundColor: expenseCategories.map((c: any) => c.chartColor),
          },
        ],
      },
      options: {
        legend: { display: true, position: 'right' },
        title: { display: true, text: 'Pecahan Perbelanjaan' },
      },
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`;
  };

  const generateHtml = () => {
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const trendChartUrl = getTrendChartUrl();
    const pieChartUrl = getPieChartUrl();

    const categoriesHtml = expenseCategories.map((cat: any) => `
      <div class="category-item">
        <div class="category-name">
          <span class="icon">${cat.icon || '📌'}</span>
          <span>${cat.name}</span>
        </div>
        <div class="category-amount">
          RM ${cat.amount.toFixed(2)} (${cat.percentage.toFixed(0)}%)
        </div>
      </div>
    `).join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; color: #00D9A8; }
            h2 { margin-top: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .summary-card { background: #f9f9f9; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; }
            .value { font-weight: bold; font-size: 1.2em; }
            .income { color: #10b981; }
            .expense { color: #ef4444; }
            .category-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .category-name { display: flex; align-items: center; }
            .icon { margin-right: 10px; }
            .footer { margin-top: 50px; text-align: center; color: #999; font-size: 0.8em; }
            .chart-container { text-align: center; margin: 20px 0; }
            img { max-width: 100%; height: auto; border-radius: 10px; }
          </style>
        </head>
        <body>
          <h1>Laporan Kewangan DuitU</h1>
          <p style="text-align: center;">Bulan: ${monthName} ${year}</p>
          
          <h2>Ringkasan</h2>
          <div class="summary-card">
            <div class="summary-row">
              <span class="label">Aset Persaraan:</span>
              <span class="value">RM ${totalAssets.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="label">Pendapatan Bulan Ini:</span>
              <span class="value income">RM ${income.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="label">Perbelanjaan Bulan Ini:</span>
              <span class="value expense">RM ${expenses.toFixed(2)}</span>
            </div>
          </div>

          <h2>Analisis Trend</h2>
          <div class="chart-container">
            <img src="${trendChartUrl}" alt="Trend Chart" />
          </div>

          <h2>Kategori Perbelanjaan</h2>
          <div class="chart-container">
            <img src="${pieChartUrl}" alt="Pie Chart" />
          </div>
          ${categoriesHtml}

          <div class="footer">
            Dijana oleh DuitU pada ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
          </div>
        </body>
      </html>
    `;
  };

  const handleExport = async () => {
    try {
      const html = generateHtml();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Ralat', 'Gagal menjana laporan PDF. Sila cuba lagi.');
    }
  };

  // Insights Calculation
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const topCategory = expenseCategories.length > 0
    ? expenseCategories.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Kewangan Anda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.balanceLabel, { color: colors.text, opacity: 0.7 }]}>
            Aset Persaraan
          </Text>
          <Text style={[styles.balanceAmount, { color: '#10b981' }]}>
            RM {totalAssets.toFixed(2)}
          </Text>
        </View>

        {/* Income & Expense Summary */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <View style={styles.summaryIconContainer}>
              <Text style={styles.summaryIcon}>💰</Text>
            </View>
            <Text style={styles.summaryLabel}>Pendapatan</Text>
            <Text style={styles.summaryAmount}>RM {income.toFixed(2)}</Text>
            <View style={styles.summaryChange}>
              <Text style={styles.summaryChangeText}>Bulan ini</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryIconContainer}>
              <Text style={styles.summaryIcon}>💳</Text>
            </View>
            <Text style={styles.summaryLabel}>Perbelanjaan</Text>
            <Text style={styles.summaryAmount}>RM {expenses.toFixed(2)}</Text>
            <View style={styles.summaryChange}>
              <Text style={styles.summaryChangeText}>Bulan ini</Text>
            </View>
          </View>
        </View>

        {/* Trend Chart Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Trend Kewangan (6 Bulan)
          </Text>
        </View>
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          {trendData.labels.length > 0 ? (
            <LineChart
              data={trendData}
              width={screenWidth - 48} // padding
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
              <Text style={{ color: '#999' }}>Memuatkan data trend...</Text>
            </View>
          )}
        </View>

        {/* Insights Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Analisis Pintar
          </Text>
        </View>
        <View style={styles.insightsGrid}>
          <View style={[styles.insightCard, { backgroundColor: '#e0f2fe' }]}>
            <Text style={styles.insightLabel}>Kadar Simpanan</Text>
            <Text style={styles.insightValue}>{savingsRate.toFixed(1)}%</Text>
            <Text style={styles.insightSubtext}>
              {savingsRate >= 20 ? "Hebat! Teruskan usaha." : "Cuba tingkatkan ke 20%."}
            </Text>
          </View>
          {topCategory && (
            <View style={[styles.insightCard, { backgroundColor: '#fce7f3' }]}>
              <Text style={styles.insightLabel}>Belanja Tertinggi</Text>
              <Text style={styles.insightValue}>{topCategory.name}</Text>
              <Text style={styles.insightSubtext}>
                RM {topCategory.amount.toFixed(0)} ({topCategory.percentage.toFixed(0)}%)
              </Text>
            </View>
          )}
        </View>

        {/* Categories Section with Pie Chart */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pecahan Perbelanjaan
          </Text>
        </View>

        <View style={[styles.categoriesCard, { backgroundColor: colors.card }]}>
          {expenseCategories.length > 0 ? (
            <PieChart
              data={expenseCategories.map((c: any) => ({
                name: c.name,
                amount: c.amount,
                color: c.chartColor,
                legendFontColor: c.legendFontColor,
                legendFontSize: c.legendFontSize
              }))}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"amount"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[10, 0]}
              absolute
            />
          ) : (
            <Text style={{ textAlign: 'center', padding: 20, color: '#999' }}>Tiada data perbelanjaan bulan ini.</Text>
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

        {/* Action Button */}
        <TouchableOpacity style={styles.exportButton} activeOpacity={0.8} onPress={handleExport}>
          <Text style={styles.exportButtonText}>📊 Eksport Laporan PDF</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
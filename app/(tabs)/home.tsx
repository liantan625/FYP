import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  SafeAreaView
} from 'react-native';
// import { PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';

const MOCK_DATA = {
  user: {
    name: "Ahmad",
  },
  financial: {
    netAmount: 6595.60,
    totalAssets: 7783.00,
    totalExpenses: 1187.40,
    trend: 5.2,
    goal: 20000.00,
    progressPercentage: 39,
    message: "Hebat Kerana Konsisten!"
  },
  quickActions: {
    retirement: {
      title: "Dana Persaraan",
      amount: 5000.00,
      change: 2.5
    },
    monthly: {
      title: "Pendapatan Bulan Ini",
      income: 4000.00,
      expenses: 1187.40
    }
  },
  expenses: {
    period: "Oktober 2025",
    categories: [
      { name: "Makanan", amount: 600, percentage: 50, color: "#00D9A8" },
      { name: "Perubatan", amount: 300, percentage: 25, color: "#FF6B6B" },
      { name: "Sewa", amount: 287, percentage: 25, color: "#FFD93D" }
    ],
    total: 1187.00
  }
};

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const chartData = MOCK_DATA.expenses.categories.map(category => ({
    name: category.name,
    population: category.amount,
    color: category.color,
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          
          <Text style={styles.headerGreeting}>Selamat Datang, {MOCK_DATA.user.name}!</Text>
          
          {/* Financial Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Jumlah Bersih</Text>
            <Text style={styles.summaryAmount}>RM {MOCK_DATA.financial.netAmount.toFixed(2)}</Text>
            <Text style={styles.summaryTrend}>↑ +{MOCK_DATA.financial.trend}% bulan ini</Text>
            
            <Text style={styles.progressTitle}>Progress: {MOCK_DATA.financial.progressPercentage}%</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${MOCK_DATA.financial.progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>RM {MOCK_DATA.financial.totalAssets.toFixed(2)} / RM {MOCK_DATA.financial.goal.toFixed(2)}</Text>
            
            <Text style={styles.summaryMessage}>✓ {MOCK_DATA.financial.message}</Text>
          </View>
        </View>

        {/* Quick Action Cards */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Dana Persaraan')}>
            <Text style={styles.quickActionTitle}>💰 {MOCK_DATA.quickActions.retirement.title}</Text>
            <Text style={styles.quickActionAmount}>RM {MOCK_DATA.quickActions.retirement.amount.toFixed(2)}</Text>
            <Text style={styles.quickActionSubtitlePositive}>+{MOCK_DATA.quickActions.retirement.change}%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Pendapatan Bulan Ini')}>
            <Text style={styles.quickActionTitle}>💵 {MOCK_DATA.quickActions.monthly.title}</Text>
            <Text style={styles.quickActionAmount}>RM {MOCK_DATA.quickActions.monthly.income.toFixed(2)}</Text>
            <Text style={styles.quickActionSubtitleNegative}>Perbelanjaan -RM {MOCK_DATA.quickActions.monthly.expenses.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

        {/* Expense Breakdown Section */}
        <View style={styles.expenseContainer}>
          <Text style={styles.expenseTitle}>{MOCK_DATA.expenses.period}</Text>
          {/* <PieChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#1cc910',
              backgroundGradientFrom: '#eff3ff',
              backgroundGradientTo: '#efefef',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          /> */}
          <View style={styles.legendContainer}>
            {MOCK_DATA.expenses.categories.map((category, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: category.color }]} />
                <Text style={styles.legendText}>{category.name}</Text>
                <Text style={styles.legendAmount}>RM {category.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.totalExpense}>Total: RM {MOCK_DATA.expenses.total.toFixed(2)}</Text>
          <TouchableOpacity style={styles.reportButton} onPress={() => Alert.alert('Report feature coming soon')}>
            <Text style={styles.reportButtonText}>📊 Lihat Laporan Penuh</Text>
          </TouchableOpacity>
        </View>
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
  headerContainer: {
    backgroundColor: '#00D9A8',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  headerTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  summaryTrend: {
    fontSize: 14,
    color: '#00C896',
    marginTop: 5,
  },
  progressTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2D3748',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  summaryMessage: {
    fontSize: 14,
    color: '#00C896',
    marginTop: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  quickActionSubtitlePositive: {
    fontSize: 12,
    color: '#00C896',
    marginTop: 5,
  },
  quickActionSubtitleNegative: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 5,
  },
  expenseContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendContainer: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    flex: 1,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalExpense: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'right',
  },
  reportButton: {
    backgroundColor: '#00D9A8',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
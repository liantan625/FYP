import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';

const MOCK_DATA = {
  summary: {
    totalBalance: 7783.00,
    totalAssets: 4120.00,
    totalExpenses: 1187.40,
  },
  expenseBreakdown: [
    { name: 'Makanan', amount: 600, percentage: 50, color: '#48BB78' },
    { name: 'Perubatan', amount: 300, percentage: 25, color: '#FF6B6B' },
    { name: 'Sewa', amount: 287, percentage: 24, color: '#FFD93D' },
  ],
  transactions: [
    {
      id: '1',
      type: 'income' as const,
      category: 'Pencen',
      subcategory: 'Bulanan',
      amount: 4000.00,
      date: '2025-04-30',
      icon: '📦',
    },
    {
      id: '2',
      type: 'expense' as const,
      category: 'Runcit',
      subcategory: 'Pantri',
      amount: 100.00,
      date: '2025-04-24',
      icon: '🛒',
    },
    {
      id: '3',
      type: 'expense' as const,
      category: 'Sewa',
      subcategory: 'Sewa',
      amount: 674.40,
      date: '2025-04-15',
      icon: '🏠',
    },
    {
      id: '4',
      type: 'expense' as const,
      category: 'Kereta',
      subcategory: 'Kereta',
      amount: 4.13,
      date: '2025-04-08',
      icon: '🚌',
    },
  ],
};

const screenWidth = Dimensions.get("window").width;

export default function TransactionsScreen() {
  const router = useRouter();

  const chartData = MOCK_DATA.expenseBreakdown.map(item => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: "#7F7F7F",
    legendFontSize: 15
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.summaryContainer}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Jumlah Baki</Text>
            <Text style={styles.balanceAmount}>RM {MOCK_DATA.summary.totalBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>📈 Aset</Text>
              <Text style={styles.summaryAmountPositive}>RM {MOCK_DATA.summary.totalAssets.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>📉 Belanja</Text>
              <Text style={styles.summaryAmountNegative}>-RM {MOCK_DATA.summary.totalExpenses.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Perbelanjaan April</Text>
          <PieChart
            data={chartData}
            width={screenWidth - 80} // Reduced width
            height={180} // Reduced height
            chartConfig={{
              backgroundColor: '#1cc910',
              backgroundGradientFrom: '#eff3ff',
              backgroundGradientTo: '#efefef',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"0"} // Adjusted padding
            absolute
          />
          <View style={styles.legendContainer}>
            {MOCK_DATA.expenseBreakdown.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.name}</Text>
                <Text style={styles.legendAmount}>RM {item.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>April 2025</Text>
          {MOCK_DATA.transactions.map(item => (
            <TouchableOpacity key={item.id} style={styles.transactionCard} onPress={() => Alert.alert(item.category, `Amount: ${item.amount}`)}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionIcon}>{item.icon}</Text>
                <View>
                  <Text style={styles.transactionCategory}>{item.category}</Text>
                  <Text style={styles.transactionSubcategory}>{item.subcategory}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={item.type === 'income' ? styles.transactionAmountPositive : styles.transactionAmountNegative}>
                  {item.type === 'income' ? '' : '-'}RM {item.amount.toFixed(2)}
                </Text>
                <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '48%',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryAmountPositive: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#48BB78',
    marginTop: 5,
  },
  summaryAmountNegative: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
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
  transactionsContainer: {
    paddingHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionSubcategory: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmountPositive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48BB78',
  },
  transactionAmountNegative: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});
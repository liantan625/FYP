import React, { useState, useEffect } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';

const screenWidth = Dimensions.get("window").width;

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

export default function TransactionsScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      return;
    }

    const assetsUnsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('assets')
      .onSnapshot(assetsSnapshot => {
        const assets = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'income' }));
        const totalAssets = assets.reduce((sum, asset) => sum + asset.amount, 0);
        const totalIncome = assets.filter(asset => asset.category === 'income').reduce((sum, asset) => sum + asset.amount, 0);

        const spendingsUnsubscribe = firestore()
          .collection('users')
          .doc(user.uid)
          .collection('spendings')
          .onSnapshot(spendingsSnapshot => {
            const spendings = spendingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'expense' }));
            const totalExpenses = spendings.reduce((sum, spending) => sum + spending.amount, 0);

            const expenseBreakdownMap = new Map();
            spendings.forEach(spending => {
              const categoryName = categoryTranslations[spending.category] || spending.category;
              if (expenseBreakdownMap.has(categoryName)) {
                expenseBreakdownMap.set(categoryName, expenseBreakdownMap.get(categoryName) + spending.amount);
              } else {
                expenseBreakdownMap.set(categoryName, spending.amount);
              }
            });

            const colors = ['#48BB78', '#FF6B6B', '#FFD93D', '#4A9EFF', '#6B9EFF'];
            let colorIndex = 0;
            const newExpenseBreakdown = Array.from(expenseBreakdownMap, ([name, amount]) => ({
              name,
              population: amount,
              color: colors[colorIndex++ % colors.length],
              legendFontSize: 0,
            }));

            setSummary({ totalAssets: totalAssets + totalIncome, totalIncome, totalExpenses });
            setExpenseBreakdown(newExpenseBreakdown);
            const translatedTransactions = [...assets, ...spendings].map(t => ({...t, category: categoryTranslations[t.category] || t.category })).sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setTransactions(translatedTransactions);
          });

        return () => spendingsUnsubscribe();
      });

    return () => assetsUnsubscribe();
}, []);

return (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>Transaksi</Text>
      <View style={{ width: 24 }} />
    </View>
    <ScrollView>
    <View style={styles.chartContainer}>
    <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>Perbelanjaan</Text>
    <PieChart
      data={expenseBreakdown}
      width={screenWidth - 160}
      height={150}
      chartConfig={{
        backgroundColor: '#1cc910',
        backgroundGradientFrom: '#eff3ff',
        backgroundGradientTo: '#efefef',
        decimalPlaces: 2,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      }}
      accessor={"population"}
      backgroundColor={"transparent"}
      paddingLeft={"15"}
      absolute
      hasLegend={false} />
    <View style={styles.legendContainer}>
      {expenseBreakdown.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
          <Text style={[styles.legendText, { fontSize: fontSize.body }]}>{item.name}</Text>
          <Text style={[styles.legendAmount, { fontSize: fontSize.body }]}>RM {item.population.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  </View>
<View style={styles.transactionsContainer}>
      <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>Transaksi</Text>
      {transactions.map(item => (
        <TouchableOpacity key={item.id} style={styles.transactionCard} onPress={() => Alert.alert(item.category, `Jumlah: RM ${item.amount.toFixed(2)}`)}>
          <View style={styles.transactionLeft}>
            <Text style={[styles.transactionIcon, { fontSize: fontSize.title }]}>{item.type === 'income' ? '📈' : '📉'}</Text>
            <View style={styles.transactionTextContainer}>
              <Text 
                style={[styles.transactionCategory, { fontSize: fontSize.medium }]} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.type === 'income' ? item.assetName : item.spendingName}
              </Text>
              <Text style={[styles.transactionSubcategory, { fontSize: fontSize.small }]}>{item.category}</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[item.type === 'income' ? styles.transactionAmountPositive : styles.transactionAmountNegative, { fontSize: fontSize.medium }]}>
              {item.type === 'income' ? '' : '-'}RM {item.amount.toFixed(2)}
            </Text>
            <Text style={[styles.transactionDate, { fontSize: fontSize.small }]}>{new Date(item.createdAt.toDate()).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' })}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
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
    color: '#666',
  },
  balanceAmount: {
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
    color: '#666',
  },
  summaryAmountPositive: {
    fontWeight: 'bold',
    color: '#48BB78',
    marginTop: 5,
  },
  summaryAmountNegative: {
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
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendContainer: {
    marginTop: 20,
    alignSelf: 'stretch',
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
    flex: 1,
  },
  legendAmount: {
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
    flex: 1,
    marginRight: 12,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionTextContainer: {
    flex: 1,
  },
  transactionCategory: {
    fontWeight: 'bold',
  },
  transactionSubcategory: {
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  transactionAmountPositive: {
    fontWeight: 'bold',
    color: '#48BB78',
  },
  transactionAmountNegative: {
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  transactionDate: {
    color: '#666',
    marginTop: 5,
  },
});
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
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
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [totalAssets, setTotalAssets] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [financialSummary, setFinancialSummary] = useState({
    netAmount: 0,
    totalAssets: 0,
    goal: 0,
    progressPercentage: 0,
  });

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const userUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(
          documentSnapshot => {
            if (documentSnapshot.exists) {
              setUserName(documentSnapshot.data().name);
            }
          },
          error => {
            console.error("Error fetching user data: ", error);
          }
        );

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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
          error => {
            console.error("Error fetching all assets: ", error);
          }
        );

      const monthlyIncomeUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .where('category', '==', 'income')
        .onSnapshot(
          assetsSnapshot => {
            let total = 0;
            if (assetsSnapshot) {
              assetsSnapshot.forEach(doc => {
                total += doc.data().amount;
              });
            }
            setMonthlyIncome(total);
          },
          error => {
            console.error("Error fetching monthly income: ", error);
          }
        );

      const spendingsUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .onSnapshot(
          spendingsSnapshot => {
            let currentMonthExpenses = 0;
            if (spendingsSnapshot) {
              spendingsSnapshot.forEach(doc => {
                currentMonthExpenses += doc.data().amount;
              });
            }
            setTotalExpenses(currentMonthExpenses);
          },
          error => {
            console.error("Error fetching spendings: ", error);
          }
        );

      const savingsUnsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('savings_goals')
        .onSnapshot(
          querySnapshot => {
            let netAmount = 0;
            let totalAssets = 0;
            let goal = 0;

            if (querySnapshot) {
              querySnapshot.forEach(doc => {
                const goalData = doc.data();
                netAmount += goalData.currentAmount;
                totalAssets += goalData.currentAmount;
                goal += goalData.targetAmount;
              });
            }

            const progressPercentage = goal > 0 ? (totalAssets / goal) * 100 : 0;

            setFinancialSummary({
              netAmount,
              totalAssets,
              goal,
              progressPercentage,
            });
          },
          error => {
            console.error("Error fetching savings goals: ", error);
          }
        );

      return () => {
        userUnsubscribe();
        allAssetsUnsubscribe();
        monthlyIncomeUnsubscribe();
        spendingsUnsubscribe();
        savingsUnsubscribe();
      };
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          
          <Text style={styles.headerGreeting}>Selamat Datang, {userName}!</Text>
          
          {/* Financial Summary Card */}
          <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/savingsgoals')}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>🎯 Matlamat Simpanan</Text>
              <Text style={styles.summaryTrendPositive}>↑ +{MOCK_DATA.financial.trend}%</Text>
            </View>
            
            <View style={styles.summaryAmountContainer}>
              <Text style={styles.summaryAmount}>💵 RM {financialSummary.netAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>📈 Kemajuan: {financialSummary.progressPercentage.toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${financialSummary.progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>RM {financialSummary.totalAssets.toFixed(2)} / RM {financialSummary.goal.toFixed(2)}</Text>
            </View>

            <View style={styles.messageContainer}>
              <Text style={styles.summaryMessage}>✅ {MOCK_DATA.financial.message}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Action Cards */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={[styles.quickActionCard, styles.quickActionCardGreen]} onPress={() => router.push('/(tabs)/analysis')}>
            <Text style={styles.quickActionEmoji}>🏦</Text>
            <Text style={styles.quickActionTitle}>Aset Persaraan</Text>
            <Text style={[styles.quickActionAmount, { color: '#10B981' }]}>RM {financialSummary.totalAssets.toFixed(2)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionCard, styles.quickActionCardRed]} onPress={() => router.push('/(tabs)/category')}>
            <Text style={styles.quickActionEmoji}>💳</Text>
            <Text style={styles.quickActionTitle}>Perbelanjaan</Text>
            <Text style={[styles.quickActionAmount, { color: '#EF4444' }]}>RM {totalExpenses.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Section */}
        <View style={styles.expenseContainer}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={styles.summaryItemEmoji}>🏠</Text>
              <Text style={styles.summaryItemTitle}>Total Aset</Text>
            </View>
            <Text style={[styles.summaryItemAmount, { color: '#3B82F6' }]}>RM {totalAssets.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={styles.summaryItemEmoji}>📥</Text>
              <Text style={styles.summaryItemTitle}>Pendapatan Bulan Ini</Text>
            </View>
            <Text style={[styles.summaryItemAmount, { color: '#10B981' }]}>RM {monthlyIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={styles.summaryItemEmoji}>📤</Text>
              <Text style={styles.summaryItemTitle}>Perbelanjaan Bulan Ini</Text>
            </View>
            <Text style={[styles.summaryItemAmount, { color: '#EF4444' }]}>RM {totalExpenses.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/report')}>
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryTrend: {
    fontSize: 14,
    color: '#00C896',
  },
  summaryAmountContainer: {
    marginTop: 10,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    color: '#666',
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
  messageContainer: {
    marginTop: 10,
  },
  summaryMessage: {
    fontSize: 14,
    color: '#00C896',
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
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryItemTitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTrendPositive: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  quickActionCardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  quickActionCardRed: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  quickActionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItemEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
});
import React, { useState, useEffect, useRef } from 'react';
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
  SafeAreaView,
  Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get("window").width;

const TIPS_DATA = [
  "💡 Simpan sekurang-kurangnya 20% pendapatan bulanan",
  "💡 Elakkan hutang kad kredit yang tinggi",
  "💡 Buat bajet bulanan dan patuhi",
  "💡 Mulakan dana kecemasan 3-6 bulan perbelanjaan",
];

export default function HomeScreen() {

  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const [userName, setUserName] = useState('');
  const [totalAssets, setTotalAssets] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [financialSummary, setFinancialSummary] = useState({
    netAmount: 0,
    totalAssets: 0,
    goal: 0,
    progressPercentage: 0,
  });

  // Calculate spending status
  const getSpendingStatus = () => {
    const budget = monthlyBudget > 0 ? monthlyBudget : monthlyIncome * 0.7; // Default 70% of income as budget
    const remaining = budget - totalExpenses;
    const isOverBudget = remaining < 0;

    return {
      isOverBudget,
      amount: Math.abs(remaining),
      budget,
    };
  };

  const spendingStatus = getSpendingStatus();

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch user data
    const userUnsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        documentSnapshot => {
          if (documentSnapshot.exists) {
            const data = documentSnapshot.data();
            setUserName(data?.name || '');
            if (data?.monthlyBudget) {
              setMonthlyBudget(data.monthlyBudget);
            }
          }
        },
        error => {
          console.error("Error fetching user data: ", error);
        }
      );

    // Fetch ALL assets (total assets)
    const allAssetsUnsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('assets')
      .onSnapshot(
        assetsSnapshot => {
          let total = 0;
          if (assetsSnapshot && !assetsSnapshot.empty) {
            assetsSnapshot.forEach(doc => {
              const amount = doc.data()?.amount || 0;
              total += amount;
            });
          }
          console.log('Total Assets:', total);
          setTotalAssets(total);
        },
        error => {
          console.error("Error fetching all assets: ", error);
        }
      );

    // Fetch monthly income (assets added this month with category 'income')
    const monthlyIncomeUnsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('assets')
      .where('category', '==', 'income')
      .onSnapshot(
        assetsSnapshot => {
          let total = 0;
          if (assetsSnapshot && !assetsSnapshot.empty) {
            assetsSnapshot.forEach(doc => {
              const data = doc.data();
              const docDate = data?.date?.toDate ? data.date.toDate() : new Date(data?.date);
              // Check if the asset is from this month
              if (docDate >= startOfMonth && docDate <= endOfMonth) {
                total += data?.amount || 0;
              }
            });
          }
          console.log('Monthly Income:', total);
          setMonthlyIncome(total);
        },
        error => {
          console.error("Error fetching monthly income: ", error);
        }
      );

    // Fetch monthly spendings
    const spendingsUnsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('spendings')
      .onSnapshot(
        spendingsSnapshot => {
          let currentMonthExpenses = 0;
          if (spendingsSnapshot && !spendingsSnapshot.empty) {
            spendingsSnapshot.forEach(doc => {
              const data = doc.data();
              const docDate = data?.date?.toDate ? data.date.toDate() : new Date(data?.date);
              // Check if the spending is from this month
              if (docDate >= startOfMonth && docDate <= endOfMonth) {
                currentMonthExpenses += data?.amount || 0;
              }
            });
          }
          console.log('Total Expenses:', currentMonthExpenses);
          setTotalExpenses(currentMonthExpenses);
        },
        error => {
          console.error("Error fetching spendings: ", error);
        }
      );

    // Fetch savings goals (only active ones)
    const savingsUnsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('savings_goals')
      .where('status', '==', 'active')
      .onSnapshot(
        querySnapshot => {
          let totalSaved = 0;
          let totalGoal = 0;

          if (querySnapshot && !querySnapshot.empty) {
            querySnapshot.forEach(doc => {
              const goalData = doc.data();
              totalSaved += goalData?.currentAmount || 0;
              totalGoal += goalData?.targetAmount || 0;
            });
          }

          const progressPercentage = totalGoal > 0 ? (totalSaved / totalGoal) * 100 : 0;

          console.log('Active Savings Goals - Saved:', totalSaved, 'Goal:', totalGoal);
          setFinancialSummary({
            netAmount: totalSaved,
            totalAssets: totalSaved,
            goal: totalGoal,
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
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>

          <View style={styles.headerTopRow}>
            <Text style={[styles.headerGreeting, { fontSize: fontSize.large }]}>{t('home.welcome', { name: userName })}</Text>
            <TouchableOpacity onPress={() => router.push('/notifications')}>
              <MaterialIcons name="notifications" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Financial Summary Card */}
          <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/savingsgoals')}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryTitle, { fontSize: fontSize.large }]}>{t('home.savingsGoal')}</Text>
            </View>

            <View style={styles.summaryAmountContainer}>
              <Text style={[styles.summaryAmount, { fontSize: fontSize.heading }]}>💵 RM {financialSummary.netAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { fontSize: fontSize.body }]}>{t('home.progress', { percentage: financialSummary.progressPercentage.toFixed(0) })}</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${financialSummary.progressPercentage}%` }]} />
              </View>
              <Text style={[styles.progressText, { fontSize: fontSize.small }]}>RM {financialSummary.totalAssets.toFixed(2)} / RM {financialSummary.goal.toFixed(2)}</Text>
            </View>

            <View style={styles.messageContainer}>
              <Text style={[styles.summaryMessage, { fontSize: fontSize.body }]}>{t('home.greatConsistency')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Action Cards */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={[styles.quickActionCard, styles.quickActionCardGreen]} onPress={() => router.push('/(tabs)/Asset')}>
            <Text style={[styles.quickActionEmoji, { fontSize: fontSize.heading }]}>🏦</Text>
            <Text style={[styles.quickActionTitle, { fontSize: fontSize.body }]}>{t('home.retirementAssets')}</Text>
            <Text style={[styles.quickActionAmount, { fontSize: fontSize.xlarge, color: '#10B981' }]}>RM {totalAssets.toFixed(2)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionCard, styles.quickActionCardRed]} onPress={() => router.push('/(tabs)/spending')}>
            <Text style={[styles.quickActionEmoji, { fontSize: fontSize.heading }]}>💳</Text>
            <Text style={[styles.quickActionTitle, { fontSize: fontSize.body }]}>{t('home.expenses')}</Text>
            <Text style={[styles.quickActionAmount, { fontSize: fontSize.xlarge, color: '#EF4444' }]}>RM {totalExpenses.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

        {/* Tools Section - 2x2 Grid */}
        <View style={styles.toolsContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="handyman" size={24} color="#1F293B" style={styles.sectionIcon} />
            <Text style={[styles.toolsSectionTitle, { fontSize: fontSize.large }]}>Alat Kewangan</Text>
          </View>

          {/* Row 1: Kalkulator & Tanya Pakar (Killer Features) */}
          <View style={styles.toolsRow}>
            <TouchableOpacity
              style={[styles.toolCard, styles.toolCardPrimary]}
              onPress={() => router.push('/calculator')}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="calculate" size={32} color="#fff" />
              </View>
              <View>
                <Text style={[styles.toolCardTitle, { fontSize: fontSize.medium }]}>Kalkulator</Text>
                <Text style={[styles.toolCardSubtitle, { fontSize: fontSize.small }]}>Kira Tarikh Persaraan</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolCard, styles.toolCardSecondary]}
              onPress={() => router.push('/expert')}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="support-agent" size={32} color="#fff" />
              </View>
              <View>
                <Text style={[styles.toolCardTitle, { fontSize: fontSize.medium }]}>Tanya Pakar</Text>
                <Text style={[styles.toolCardSubtitle, { fontSize: fontSize.small }]}>Nasihat Kewangan</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: Peringatan (Status Widget) & Tips (Auto-scroll Banner) */}
          <View style={styles.toolsRow}>
            {/* Spending Reminder Status Widget */}
            <TouchableOpacity
              style={[
                styles.toolCardSmall,
                spendingStatus.isOverBudget ? styles.toolCardDanger : styles.toolCardSuccess
              ]}
              onPress={() => router.push('/reminders')}
            >
              <View style={styles.smallIconContainer}>
                <MaterialIcons
                  name={spendingStatus.isOverBudget ? "warning" : "check-circle"}
                  size={24}
                  color="rgba(255,255,255,0.9)"
                />
              </View>
              <View>
                <Text style={[
                  styles.statusTitle,
                  { fontSize: fontSize.small }
                ]}>
                  {spendingStatus.isOverBudget ? 'Lebihan Belanja' : 'Terkawal'}
                </Text>
                {spendingStatus.isOverBudget && (
                  <Text style={[styles.statusAmount, { fontSize: fontSize.small }]}>
                    RM {spendingStatus.amount.toFixed(2)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Tips Static Banner */}
            <TouchableOpacity
              style={[styles.toolCardSmall, styles.toolCardTips]}
              onPress={() => router.push('/tips')}
            >
              <View style={styles.smallIconContainer}>
                <MaterialIcons name="lightbulb" size={24} color="rgba(255,255,255,0.9)" />
              </View>
              <Text
                style={[
                  styles.tipsText,
                  { fontSize: fontSize.small }
                ]}
                numberOfLines={3}
              >
                {TIPS_DATA[0].replace('💡 ', '')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.expenseContainer}>
          <Text style={[styles.expenseTitle, { fontSize: fontSize.large }]}>{t('home.monthSummary')}</Text>

          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={[styles.summaryItemEmoji, { fontSize: fontSize.xlarge }]}>🏠</Text>
              <Text
                style={[styles.summaryItemTitle, { fontSize: fontSize.medium }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('home.totalAssets')}
              </Text>
            </View>
            <View style={styles.summaryItemRight}>
              <Text style={[styles.summaryItemAmount, { fontSize: fontSize.medium, color: '#3B82F6' }]}>RM {totalAssets.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={[styles.summaryItemEmoji, { fontSize: fontSize.xlarge }]}>📥</Text>
              <Text
                style={[styles.summaryItemTitle, { fontSize: fontSize.medium }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('home.income')}
              </Text>
            </View>
            <Text style={[styles.summaryItemAmount, { fontSize: fontSize.medium, color: '#10B981' }]}>RM {monthlyIncome.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryItemLeft}>
              <Text style={[styles.summaryItemEmoji, { fontSize: fontSize.xlarge }]}>📤</Text>
              <Text
                style={[styles.summaryItemTitle, { fontSize: fontSize.medium }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('home.expenses')}
              </Text>
            </View>
            <Text style={[styles.summaryItemAmount, { fontSize: fontSize.medium, color: '#EF4444' }]}>RM {totalExpenses.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/report')}>
            <Text style={[styles.reportButtonText, { fontSize: fontSize.medium }]}>{t('home.viewFullReport')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating AI Chat Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/expert')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="smart-toy" size={28} color="#fff" />
      </TouchableOpacity>
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
    backgroundColor: '#48BB78',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTime: {
    fontWeight: 'bold',
  },
  headerGreeting: {
    fontWeight: 'bold',
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
    color: '#666',
  },
  summaryTrend: {
    color: '#00C896',
  },
  summaryAmountContainer: {
    marginTop: 10,
  },
  summaryAmount: {
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
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  messageContainer: {
    marginTop: 10,
  },
  summaryMessage: {
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
    fontWeight: 'bold',
  },
  quickActionAmount: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  quickActionSubtitlePositive: {
    color: '#00C896',
    marginTop: 5,
  },
  quickActionSubtitleNegative: {
    color: '#FF6B6B',
    marginTop: 5,
  },
  expenseContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseTitle: {
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
    flex: 1,
  },
  legendAmount: {
    fontWeight: 'bold',
  },
  totalExpense: {
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'right',
  },
  reportButton: {
    backgroundColor: '#48BB78',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  summaryItemEmoji: {
    marginRight: 12,
  },
  summaryItemTitle: {
    color: '#666',
    flex: 1,
  },
  summaryItemRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  summaryItemAmount: {
    fontWeight: 'bold',
    flexShrink: 0,
  },
  summaryItemTrend: {
    fontWeight: '600',
    marginTop: 2,
  },
  summaryTrendPositive: {
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
    marginBottom: 8,
  },
  // Tools Section Styles
  toolsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    marginRight: 10,
  },
  toolsSectionTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toolCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    height: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  toolCardPrimary: {
    backgroundColor: '#1E293B', // Slate 800
  },
  toolCardSecondary: {
    backgroundColor: '#1E3A8A', // Blue 900
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toolCardTitle: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  toolCardSubtitle: {
    color: '#94A3B8', // Slate 400
  },
  toolCardSmall: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    height: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  toolCardSuccess: {
    backgroundColor: '#065F46', // Emerald 800
    borderWidth: 0,
  },
  toolCardDanger: {
    backgroundColor: '#991B1B', // Red 800
    borderWidth: 0,
  },
  toolCardTips: {
    backgroundColor: '#B45309', // Amber 700
    borderWidth: 0,
  },
  smallIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontWeight: '600',
    color: '#fff',
  },
  statusAmount: {
    fontWeight: 'bold',
    color: '#FECACA', // Light red text
    marginTop: 2,
  },
  tipsText: {
    color: '#fff',
    fontWeight: '500',
    lineHeight: 20,
  },
  tipsMore: {
    display: 'none',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB', // Blue 600
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 100,
  },
});
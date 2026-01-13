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
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get("window").width;


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
        (documentSnapshot: any) => {
          const data = documentSnapshot.data();
          if (data) {
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Simplified & Clear */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.headerGreeting, { fontSize: fontSize.large }]}>
                {t('home.welcome', { name: userName })}
              </Text>
              <Text style={[styles.headerDate, { fontSize: fontSize.small }]}>
                {new Date().toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              accessible={true}
              accessibilityLabel={t('notifications.title')}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={styles.notificationButton}
            >
              <MaterialIcons name="notifications-none" size={32} color="#FFFFFF" />
              {/* Optional: Add red dot if unread */}
            </TouchableOpacity>
          </View>

          {/* Savings Goal Card - Redesigned for Large Text */}
          <TouchableOpacity
            style={styles.mainCard}
            onPress={() => router.push('/savingsgoals')}
            accessible={true}
            accessibilityLabel={`${t('home.savingsGoal')}. ${t('home.progress', { percentage: financialSummary.progressPercentage.toFixed(0) })}. RM ${financialSummary.netAmount.toFixed(2)}`}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <MaterialIcons name="savings" size={24} color="#48BB78" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: fontSize.medium }]}>{t('home.savingsGoal')}</Text>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </View>

            <View style={styles.mainAmountContainer}>
              <Text style={[styles.currencySymbol, { fontSize: fontSize.large }]}>RM</Text>
              <Text style={[styles.mainAmount, { fontSize: fontSize.heading }]}>
                {financialSummary.netAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { fontSize: fontSize.small }]}>
                  {t('home.progress', { percentage: financialSummary.progressPercentage.toFixed(0) })}
                </Text>
                <Text style={[styles.targetLabel, { fontSize: fontSize.small }]}>
                  / RM {financialSummary.goal.toFixed(2)}
                </Text>
              </View>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(financialSummary.progressPercentage, 100)}%` }]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats - Vertical List for better readability on large fonts */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>
            {t('home.monthSummary')}
          </Text>

          <View style={styles.statsGrid}>
            {/* Total Assets */}
            <TouchableOpacity
              style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}
              onPress={() => router.push('/(tabs)/Asset')}
              accessible={true}
              accessibilityLabel={`${t('home.totalAssets')}, RM ${totalAssets.toFixed(2)}`}
              accessibilityRole="button"
            >
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="account-balance" size={32} color="#3B82F6" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, { fontSize: fontSize.body }]}>{t('home.totalAssets')}</Text>
                <Text style={[styles.statValue, { fontSize: fontSize.large, color: '#1D4ED8' }]}>
                  RM {totalAssets.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Expenses */}
            <TouchableOpacity
              style={[styles.statCard, { borderLeftColor: '#EF4444' }]}
              onPress={() => router.push('/(tabs)/spending')}
              accessible={true}
              accessibilityLabel={`${t('home.expenses')}, RM ${totalExpenses.toFixed(2)}`}
              accessibilityRole="button"
            >
              <View style={[styles.statIcon, { backgroundColor: '#FEF2F2' }]}>
                <MaterialIcons name="trending-down" size={32} color="#EF4444" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, { fontSize: fontSize.body }]}>{t('home.expenses')}</Text>
                <Text style={[styles.statValue, { fontSize: fontSize.large, color: '#B91C1C' }]}>
                  RM {totalExpenses.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Income */}
            <View
              style={[styles.statCard, { borderLeftColor: '#10B981' }]}
              accessible={true}
              accessibilityLabel={`${t('home.income')}, RM ${monthlyIncome.toFixed(2)}`}
            >
              <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                <MaterialIcons name="trending-up" size={32} color="#10B981" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, { fontSize: fontSize.body }]}>{t('home.income')}</Text>
                <Text style={[styles.statValue, { fontSize: fontSize.large, color: '#047857' }]}>
                  RM {monthlyIncome.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* View Full Report Button */}
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => router.push('/report')}
              accessible={true}
              accessibilityLabel={t('home.viewFullReport')}
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.reportButtonText, { fontSize: fontSize.medium }]}>
                {t('home.viewFullReport')}
              </Text>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tools Grid - Spacious */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="grid-view" size={28} color="#1F2937" style={styles.sectionHeaderIcon} />
            <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('financialTools.title')}</Text>
          </View>

          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => router.push('/calculator')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('financialTools.calculator')}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialIcons name="calculate" size={36} color="#0284C7" />
              </View>
              <Text style={[styles.toolTitle, { fontSize: fontSize.medium }]}>{t('financialTools.calculator')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => router.push('/expert')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('financialTools.expert')}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#F0FDF4' }]}>
                <MaterialIcons name="support-agent" size={36} color="#16A34A" />
              </View>
              <Text style={[styles.toolTitle, { fontSize: fontSize.medium }]}>{t('financialTools.expert')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => router.push('/reminders')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('financialTools.reminders')}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons
                  name={spendingStatus.isOverBudget ? "warning" : "notifications-active"}
                  size={36}
                  color="#D97706"
                />
              </View>
              <Text style={[styles.toolTitle, { fontSize: fontSize.medium }]}>{t('financialTools.reminders')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => router.push('/tips')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('financialTools.tips')}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#F3E8FF' }]}>
                <MaterialIcons name="lightbulb" size={36} color="#9333EA" />
              </View>
              <Text style={[styles.toolTitle, { fontSize: fontSize.medium }]}>{t('financialTools.tips')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Banner - Full Width for Readability */}
        <View
          style={[
            styles.statusBanner,
            spendingStatus.isOverBudget ? styles.statusBannerDanger : styles.statusBannerSuccess
          ]}
          accessible={true}
          accessibilityLabel={`${spendingStatus.isOverBudget ? t('financialTools.overBudget') : t('financialTools.controlled')}${spendingStatus.isOverBudget ? `, RM ${spendingStatus.amount.toFixed(2)}` : ''}`}
        >
          <MaterialIcons
            name={spendingStatus.isOverBudget ? "error-outline" : "check-circle-outline"}
            size={32}
            color="#fff"
          />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusBannerTitle, { fontSize: fontSize.medium }]}>
              {spendingStatus.isOverBudget ? t('financialTools.overBudget') : t('financialTools.controlled')}
            </Text>
            {spendingStatus.isOverBudget && (
              <Text style={[styles.statusBannerSubtitle, { fontSize: fontSize.body }]}>
                RM {spendingStatus.amount.toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating AI Chat Button - Larger & Accessible */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/expert')}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel="Chat with financial expert AI"
        accessibilityRole="button"
      >
        <MaterialIcons name="smart-toy" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Lighter grey background
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Increased to avoid FAB overlap (was 20)
  },
  headerContainer: {
    padding: 24,
    backgroundColor: '#48BB78', // Green background
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    paddingBottom: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Removing space-between so elements hug each other
    marginBottom: 24,
  },
  headerGreeting: {
    fontWeight: '800',
    color: '#FFFFFF', // White text
    marginBottom: 4,
  },
  headerDate: {
    color: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  notificationButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white button
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
    marginLeft: 12, // Restored margin for spacing
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    color: '#374151',
    fontWeight: '600',
  },
  mainAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  currencySymbol: {
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 4,
  },
  mainAmount: {
    color: '#111827',
    fontWeight: '900',
    letterSpacing: -1,
  },
  progressSection: {
    width: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#059669', // Strong green
    fontWeight: '700',
  },
  targetLabel: {
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeaderIcon: {
    marginRight: 12,
    opacity: 0.8,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '800',
  },
  reportButton: {
    backgroundColor: '#1E293B', // Dark Slate for contrast
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  toolItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  toolIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBannerSuccess: {
    backgroundColor: '#059669', // Emerald 600
  },
  statusBannerDanger: {
    backgroundColor: '#DC2626', // Red 600
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusBannerTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  statusBannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64, // LargeFAB
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
});
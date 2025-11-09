import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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
  'Runcit': { icon: '🛒', subtext: 'Makanan & Keperluan', color: '#fce7f3' },
  'Sewa': { icon: '🏠', subtext: 'Utiliti & Perumahan', color: '#fef3c7' },
  'Perayaan': { icon: '🎁', subtext: 'Hadiah & Sambutan', color: '#e0e7ff' },
  'Hiburan': { icon: '🎉', subtext: 'Rekreasi & Santai', color: '#e0e7ff' },
  'Lain-Lain': { icon: '🤷', subtext: 'Lain-lain', color: '#f3f4f6' },
};

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [totalAssets, setTotalAssets] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [expenseCategories, setExpenseCategories] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
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
            let totalIncome = 0;
            if (assetsSnapshot) {
              assetsSnapshot.forEach(doc => {
                totalIncome += doc.data().amount;
              });
            }
            setIncome(totalIncome);
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
            let totalExpenses = 0;
            const expenseBreakdownMap = new Map();
            if (spendingsSnapshot) {
              spendingsSnapshot.forEach(doc => {
                const spending = doc.data();
                totalExpenses += spending.amount;
                const categoryName = categoryTranslations[spending.category] || spending.category;
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
              ...categoryDetails[name]
            }));
            setExpenseCategories(categories);
          },
          error => {
            console.error("Error fetching spendings: ", error);
          }
        );

      return () => {
        allAssetsUnsubscribe();
        monthlyIncomeUnsubscribe();
        spendingsUnsubscribe();
      };
    }
  }, []);

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
        {/* Balance Card - Highlighted */}
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

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Kategori Perbelanjaan
          </Text>
        </View>

        <View style={[styles.categoriesCard, { backgroundColor: colors.card }]}>
          {expenseCategories.map((category, index) => (
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

        {/* Tips Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Petua Kewangan
          </Text>
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
          <View style={styles.tipItem}>
            <View style={styles.tipIconContainer}>
              <Text style={styles.tipIcon}>💡</Text>
            </View>
            <Text style={[styles.tipText, { color: colors.text }]}>
              Simpan 20% daripada pendapatan anda setiap bulan
            </Text>
          </View>

          <View style={styles.tipDivider} />

          <View style={styles.tipItem}>
            <View style={styles.tipIconContainer}>
              <Text style={styles.tipIcon}>📝</Text>
            </View>
            <Text style={[styles.tipText, { color: colors.text }]}>
              Rekod semua perbelanjaan anda untuk kawalan yang lebih baik
            </Text>
          </View>

          <View style={styles.tipDivider} />

          <View style={styles.tipItem}>
            <View style={styles.tipIconContainer}>
              <Text style={styles.tipIcon}>🎯</Text>
            </View>
            <Text style={[styles.tipText, { color: colors.text }]}>
              Tetapkan matlamat simpanan jangka pendek dan panjang
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.exportButton} activeOpacity={0.8}>
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
  balanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  balanceIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
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
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  tipDivider: {
    height: 1,
    backgroundColor: '#e8ecef',
    marginVertical: 4,
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
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});
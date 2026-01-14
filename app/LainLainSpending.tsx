import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export default function LainLainSpendingScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t, i18n } = useTranslation();
  const [spendings, setSpendings] = useState<any[]>([]);

  const dateLocale = i18n.language === 'ms' ? 'ms-MY' : i18n.language === 'zh' ? 'zh-CN' : 'en-US';

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .where('category', '==', 'others')
        .onSnapshot(querySnapshot => {
          const spendingsData: any[] = [];
          if (querySnapshot) {
            querySnapshot.forEach(doc => {
              spendingsData.push({ id: doc.id, ...doc.data() });
            });
          }
          setSpendings(spendingsData);
        });

      return () => unsubscribe();
    }
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View
      style={styles.assetItem}
      accessible={true}
      accessibilityLabel={`${item.spendingName}, ${item.description}, -RM ${item.amount.toFixed(2)}, ${new Date(item.createdAt.toDate()).toLocaleDateString('en-GB')}`}
    >
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[styles.assetName, { fontSize: fontSize.medium }]}>{item.spendingName}</Text>
        <Text style={[styles.assetDescription, { fontSize: fontSize.small }]}>
          {item.description || t('transactions.na')}
        </Text>
        <Text style={[styles.assetDate, { fontSize: fontSize.small }]}>
          {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('en-GB') : ''}
        </Text>
      </View>
      <View style={styles.assetRight}>
        <Text style={[styles.assetAmount, { fontSize: fontSize.medium }]}>-RM {item.amount.toFixed(2)}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/editSpending/${item.id}`)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          accessibilityLabel={t('common.edit')}
          accessibilityRole="button"
          style={styles.editButton}
        >
          <MaterialIcons name="edit" size={24} color="#475569" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]} accessibilityRole="header">
          {t('transactions.others')}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={spendings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontSize: fontSize.medium }]}>
              {t('transactions.noTransactions')}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#00D9A8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  assetItem: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assetName: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  assetDescription: {
    color: '#64748B',
    marginBottom: 4,
  },
  assetDate: {
    color: '#94A3B8',
  },
  assetRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  assetAmount: {
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  editButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#94A3B8',
  },
});

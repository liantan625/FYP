import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HiburanScreen() {
  const router = useRouter();
  const [spendings, setSpendings] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .where('category', '==', 'entertainment')
        .onSnapshot(querySnapshot => {
          const spendingsData = [];
          querySnapshot.forEach(doc => {
            spendingsData.push({ id: doc.id, ...doc.data() });
          });
          setSpendings(spendingsData);
        });

      return () => unsubscribe();
    }
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.assetItem}>
      <View>
        <Text style={styles.assetName}>{item.spendingName}</Text>
        <Text style={styles.assetDescription}>{item.description}</Text>
        <Text style={styles.assetDate}>{new Date(item.createdAt.toDate()).toLocaleDateString()}</Text>
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetAmount}>-RM {item.amount.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => router.push(`/editSpending/${item.id}`)}>
          <MaterialIcons name="edit" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hiburan</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={spendings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tiada perbelanjaan hiburan.</Text>
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
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  assetItem: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  assetDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

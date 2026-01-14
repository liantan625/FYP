
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for demonstration
const MOCK_ASSETS = {
  investment: [
    { id: '1', name: 'ASNB', type: 'Unit Trust', amount: 2283.00 },
    { id: '2', name: 'Saham', type: 'Stocks', amount: 0.00 }
  ],
};

export default function PelaburanScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .where('category', '==', 'investment')
        .onSnapshot(querySnapshot => {
          const assetsData = [];
          querySnapshot.forEach(doc => {
            assetsData.push({ id: doc.id, ...doc.data() });
          });
          setAssets(assetsData);
        });

      return () => unsubscribe();
    }
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.assetItem}>
      <View>
        <Text style={styles.assetName}>{item.assetName}</Text>
        <Text style={styles.assetDescription}>{item.description}</Text>
        <Text style={styles.assetDate}>{new Date(item.createdAt.toDate()).toLocaleDateString('en-GB')}</Text>
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetAmount}>RM {item.amount.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => router.push(`/editAsset/${item.id}`)}>
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
        <Text style={styles.headerTitle}>Pelaburan</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
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
  },
});

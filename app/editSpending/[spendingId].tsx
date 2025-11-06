import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function EditSpendingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { spendingId } = params;

  const [spending, setSpending] = useState(null);
  const [spendingName, setSpendingName] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const user = auth().currentUser;
    if (user && spendingId) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .doc(spendingId)
        .onSnapshot(doc => {
          if (doc.exists) {
            const spendingData = doc.data();
            setSpending(spendingData);
            setSpendingName(spendingData.spendingName);
            setAmount(spendingData.amount.toString());
            setDescription(spendingData.description);
          }
        });

      return () => unsubscribe();
    }
  }, [spendingId]);

  const handleUpdate = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update a spending.');
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .doc(spendingId)
        .update({
          spendingName,
          amount: parseFloat(amount),
          description,
        });

      Alert.alert('Simpan', 'Perbelanjaan berjaya dikemaskini!');
      router.back();
    } catch (error) {
      console.error('Error updating spending: ', error);
      Alert.alert('Error', 'Gagal mengemaskini perbelanjaan. Sila cuba lagi.');
    }
  };

  const handleDelete = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete a spending.');
      return;
    }

    Alert.alert(
      'Padam Perbelanjaan',
      'Anda pasti mahu padam perbelanjaan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Padam',
          onPress: async () => {
            try {
              await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('spendings')
                .doc(spendingId)
                .delete();

              Alert.alert('Padam', 'Perbelanjaan berjaya dipadam!');
              router.back();
            } catch (error) {
              console.error('Error deleting spending: ', error);
              Alert.alert('Error', 'Gagal memadam perbelanjaan. Sila cuba lagi.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  if (!spending) {
    return null; // Or a loading indicator
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kemaskini Perbelanjaan</Text>
        <TouchableOpacity onPress={handleDelete}>
          <MaterialIcons name="delete" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>Nama Perbelanjaan</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={spendingName}
              onChangeText={setSpendingName}
            />
          </View>

          <Text style={styles.label}>Amaun</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencyLabel}>MYR</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Penerangan (Pilihan)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
            <Text style={styles.saveButtonText}>Kemaskini</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
  },
  currencyLabel: {
    padding: 15,
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  amountInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#00D9A8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

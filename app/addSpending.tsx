import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const spendingCategories = [
  { label: "Runcit", value: "groceries" },
  { label: "Sewa", value: "rent" },
  { label: "Perayaan", value: "celebration" },
  { label: "Hiburan", value: "entertainment" },
  { label: "Lain-Lain", value: "others" }
];

const defaultCurrency = "MYR";

export default function AddSpendingScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate) => {
    setDate(selectedDate);
    hideDatePicker();
  };
  const [category, setCategory] = useState(null);
  const [spendingName, setSpendingName] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [description, setDescription] = useState('');

  const handleSave = async () => {
    console.log('handleSave called');
    const user = auth().currentUser;
    if (!user) {
      console.log('User not logged in');
      Alert.alert('Error', 'You must be logged in to add an asset.');
      return;
    }
    console.log('User UID:', user.uid);

    if (!category || !spendingName || !amount) {
      console.log('Missing fields:', { category, spendingName, amount });
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    console.log('All fields filled');

    try {
      console.log('Attempting to save to Firestore');
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spendings')
        .add({
          date,
          category,
          spendingName,
          amount: parseFloat(amount),
          description,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      console.log('Save successful');

      Alert.alert('Simpan', 'Perbelanjaan berjaya disimpan!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error adding spending: ', error);
      Alert.alert('Error', 'Gagal menyimpan perbelanjaan. Sila cuba lagi.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Perbelanjaan</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>📅 Tarikh</Text>
          <TouchableOpacity onPress={showDatePicker} style={styles.inputContainer}>
            <Text style={styles.input}>{date.toLocaleDateString()}</Text>
            <MaterialIcons name="calendar-today" size={24} color="#666" style={styles.inputIcon} />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />

          <Text style={styles.label}>📂 Kategori Perbelanjaan</Text>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setCategory(value)}
              items={spendingCategories}
              placeholder={{ label: 'Pilih Jenis Perbelanjaan', value: null }}
              style={pickerSelectStyles}
            />
          </View>

          <Text style={styles.label}>💸 Nama Perbelanjaan</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Makan Malam"
              value={spendingName}
              onChangeText={setSpendingName}
            />
          </View>

          <Text style={styles.label}>💰 Amaun</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencyLabel}>{defaultCurrency}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>📝 Penerangan (Pilihan)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tambah nota..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan</Text>
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
  pickerContainer: {
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
  inputIcon: {
    padding: 15,
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

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  placeholder: {
    color: '#666',
  },
});

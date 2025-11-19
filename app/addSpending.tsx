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
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultSpendingCategories = [
  { label: "Runcit", value: "groceries" },
  { label: "Sewa", value: "rent" },
  { label: "Perayaan", value: "celebration" },
  { label: "Hiburan", value: "entertainment" },
  { label: "Lain-Lain", value: "others" }
];

const defaultCurrency = "MYR";

export default function AddSpendingScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [spendingCategories, setSpendingCategories] = useState(defaultSpendingCategories);

  // Load custom categories on mount
  useEffect(() => {
    loadCustomCategories();
  }, []);

  const loadCustomCategories = async () => {
    try {
      const customCategoriesJson = await AsyncStorage.getItem('customCategories');
      if (customCategoriesJson) {
        const customCategories = JSON.parse(customCategoriesJson);
        // Combine default + custom categories
        setSpendingCategories([...defaultSpendingCategories, ...customCategories]);
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
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

      // Add notification
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notifications')
        .add({
          title: 'Perbelanjaan Direkod',
          message: `Anda telah merekod perbelanjaan '${spendingName}' bernilai RM ${parseFloat(amount).toFixed(2)}`,
          type: 'spending',
          createdAt: firestore.FieldValue.serverTimestamp(),
          read: false,
          amount: -parseFloat(amount),
          category: category,
        });

      Toast.show({
        type: 'success',
        text1: 'Simpan',
        text2: 'Perbelanjaan berjaya disimpan!',
      });
      router.back();
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
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>Tambah Perbelanjaan</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>📅 Tarikh</Text>
          <TouchableOpacity onPress={showDatePicker} style={styles.inputContainer}>
            <Text style={[styles.input, { fontSize: fontSize.medium }]}>{date.toLocaleDateString()}</Text>
            <MaterialIcons name="calendar-today" size={24} color="#666" style={styles.inputIcon} />
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />

          <Text style={[styles.label, { fontSize: fontSize.medium }]}>📂 Kategori Perbelanjaan</Text>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setCategory(value)}
              items={spendingCategories}
              placeholder={{ label: 'Pilih Jenis Perbelanjaan', value: null }}
              style={pickerSelectStyles(fontSize.fontScale)}
            />
          </View>

          <Text style={[styles.label, { fontSize: fontSize.medium }]}>💸 Nama Perbelanjaan</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              placeholder="Contoh: Makan Malam"
              value={spendingName}
              onChangeText={setSpendingName}
            />
          </View>

          <Text style={[styles.label, { fontSize: fontSize.medium }]}>💰 Amaun</Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.currencyLabel, { fontSize: fontSize.medium }]}>{defaultCurrency}</Text>
            <TextInput
              style={[styles.amountInput, { fontSize: fontSize.medium }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <Text style={[styles.label, { fontSize: fontSize.medium }]}>📝 Penerangan (Pilihan)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea, { fontSize: fontSize.medium }]}
              placeholder="Tambah nota..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={[styles.saveButtonText, { fontSize: fontSize.medium }]}>Simpan</Text>
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
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  amountInput: {
    flex: 1,
    padding: 15,
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
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = (fontScale: number) => StyleSheet.create({
  inputIOS: {
    fontSize: 16 * fontScale,
    paddingVertical: 15,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16 * fontScale,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'black',
    paddingRight: 30,
  },
  placeholder: {
    color: '#666',
  },
});

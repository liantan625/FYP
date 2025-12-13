import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface Reminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isEnabled: boolean;
  category: string;
}

const REMINDER_CATEGORIES = [
  { id: 'bill', label: 'Bil', emoji: '📄' },
  { id: 'loan', label: 'Pinjaman', emoji: '🏦' },
  { id: 'subscription', label: 'Langganan', emoji: '📱' },
  { id: 'savings', label: 'Simpanan', emoji: '💰' },
  { id: 'other', label: 'Lain-lain', emoji: '📌' },
];

export default function RemindersScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Bil Elektrik', amount: 150, dueDate: '25', isEnabled: true, category: 'bill' },
    { id: '2', title: 'Bil Air', amount: 30, dueDate: '20', isEnabled: true, category: 'bill' },
    { id: '3', title: 'Netflix', amount: 45, dueDate: '15', isEnabled: true, category: 'subscription' },
    { id: '4', title: 'Simpanan Bulanan', amount: 500, dueDate: '1', isEnabled: true, category: 'savings' },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    amount: '',
    dueDate: '',
    category: 'bill',
  });

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  };

  const deleteReminder = (id: string) => {
    Alert.alert(
      'Padam Peringatan',
      'Adakah anda pasti mahu memadamkan peringatan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Padam',
          style: 'destructive',
          onPress: () => setReminders((prev) => prev.filter((r) => r.id !== id)),
        },
      ]
    );
  };

  const addReminder = () => {
    if (!newReminder.title || !newReminder.amount || !newReminder.dueDate) {
      Alert.alert('Ralat', 'Sila isi semua maklumat');
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      amount: parseFloat(newReminder.amount),
      dueDate: newReminder.dueDate,
      isEnabled: true,
      category: newReminder.category,
    };

    setReminders((prev) => [...prev, reminder]);
    setNewReminder({ title: '', amount: '', dueDate: '', category: 'bill' });
    setShowAddForm(false);
  };

  const getCategoryEmoji = (category: string) => {
    return REMINDER_CATEGORIES.find((c) => c.id === category)?.emoji || '📌';
  };

  const totalMonthlyReminders = reminders
    .filter((r) => r.isEnabled)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>⏰ Peringatan</Text>
        <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#00D9A8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { fontSize: fontSize.small }]}>
            Jumlah Peringatan Bulanan
          </Text>
          <Text style={[styles.summaryAmount, { fontSize: fontSize.xlarge }]}>
            RM {totalMonthlyReminders.toFixed(2)}
          </Text>
          <Text style={[styles.summaryCount, { fontSize: fontSize.small }]}>
            {reminders.filter((r) => r.isEnabled).length} peringatan aktif
          </Text>
        </View>

        {showAddForm && (
          <View style={styles.addFormCard}>
            <Text style={[styles.formTitle, { fontSize: fontSize.medium }]}>
              Tambah Peringatan Baru
            </Text>
            
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              placeholder="Nama peringatan"
              value={newReminder.title}
              onChangeText={(text) => setNewReminder((prev) => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              placeholder="Jumlah (RM)"
              keyboardType="numeric"
              value={newReminder.amount}
              onChangeText={(text) => setNewReminder((prev) => ({ ...prev, amount: text }))}
            />
            
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              placeholder="Tarikh (1-31)"
              keyboardType="numeric"
              value={newReminder.dueDate}
              onChangeText={(text) => setNewReminder((prev) => ({ ...prev, dueDate: text }))}
            />

            <View style={styles.categoryContainer}>
              {REMINDER_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    newReminder.category === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setNewReminder((prev) => ({ ...prev, category: cat.id }))}
                >
                  <Text>{cat.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={addReminder}
              >
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>
          Senarai Peringatan
        </Text>

        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderCard}>
            <View style={styles.reminderLeft}>
              <Text style={styles.reminderEmoji}>{getCategoryEmoji(reminder.category)}</Text>
              <View style={styles.reminderInfo}>
                <Text style={[styles.reminderTitle, { fontSize: fontSize.medium }]}>
                  {reminder.title}
                </Text>
                <Text style={[styles.reminderDue, { fontSize: fontSize.small }]}>
                  Setiap {reminder.dueDate} haribulan
                </Text>
              </View>
            </View>
            <View style={styles.reminderRight}>
              <Text style={[styles.reminderAmount, { fontSize: fontSize.medium }]}>
                RM {reminder.amount.toFixed(2)}
              </Text>
              <View style={styles.reminderActions}>
                <Switch
                  value={reminder.isEnabled}
                  onValueChange={() => toggleReminder(reminder.id)}
                  trackColor={{ false: '#E2E8F0', true: '#00D9A8' }}
                  thumbColor="#fff"
                />
                <TouchableOpacity onPress={() => deleteReminder(reminder.id)}>
                  <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#00D9A8',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  summaryAmount: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  addFormCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  categoryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#00D9A8',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#00D9A8',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontWeight: '600',
    color: '#333',
  },
  reminderDue: {
    color: '#666',
    marginTop: 2,
  },
  reminderRight: {
    alignItems: 'flex-end',
  },
  reminderAmount: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

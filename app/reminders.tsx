import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Reminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isEnabled: boolean;
  category: string;
}

const REMINDER_CATEGORIES = [
  { id: 'bill', labelKey: 'reminders.categories.bill', emoji: '📄' },
  { id: 'loan', labelKey: 'reminders.categories.loan', emoji: '🏦' },
  { id: 'subscription', labelKey: 'reminders.categories.subscription', emoji: '📱' },
  { id: 'savings', labelKey: 'reminders.categories.savings', emoji: '💰' },
  { id: 'other', labelKey: 'reminders.categories.other', emoji: '📌' },
];

export default function RemindersScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    amount: '',
    dueDate: new Date().getDate().toString(),
    category: 'bill',
  });

  // Validation errors
  const [errors, setErrors] = useState<{ title?: string; amount?: string; dueDate?: string }>({});

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch reminders from Firebase
  const fetchReminders = useCallback(async () => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('reminders')
        .orderBy('dueDate', 'asc')
        .get();

      if (!snapshot) {
        setIsLoading(false);
        return;
      }

      const fetchedReminders: Reminder[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reminder[];

      setReminders(fetchedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      Alert.alert(t('reminders.error'), t('reminders.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  }, [fetchReminders]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: { title?: string; amount?: string; dueDate?: string } = {};

    if (!newReminder.title.trim()) {
      newErrors.title = t('reminders.validation.nameRequired');
    } else if (newReminder.title.trim().length < 2) {
      newErrors.title = t('reminders.validation.nameMin');
    }

    if (!newReminder.amount.trim()) {
      newErrors.amount = t('reminders.validation.amountRequired');
    } else {
      const amount = parseFloat(newReminder.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = t('reminders.validation.amountPositive');
      } else if (amount > 1000000) {
        newErrors.amount = t('reminders.validation.amountTooLarge');
      }
    }

    if (!newReminder.dueDate.trim()) {
      newErrors.dueDate = t('reminders.validation.dateRequired');
    } else {
      const day = parseInt(newReminder.dueDate, 10);
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.dueDate = t('reminders.validation.dateRange');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Toggle reminder enabled status
  const toggleReminder = async (id: string, currentStatus: boolean) => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('reminders')
        .doc(id)
        .update({ isEnabled: !currentStatus });

      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isEnabled: !currentStatus } : r))
      );
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert(t('reminders.error'), t('reminders.updateFailed'));
    }
  };

  // Delete reminder
  const deleteReminder = (id: string) => {
    Alert.alert(
      t('reminders.deleteConfirm'),
      t('reminders.deleteMessage'),
      [
        { text: t('reminders.cancel'), style: 'cancel' },
        {
          text: t('reminders.delete'),
          style: 'destructive',
          onPress: async () => {
            const user = auth().currentUser;
            if (!user) return;

            try {
              await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('reminders')
                .doc(id)
                .delete();

              setReminders((prev) => prev.filter((r) => r.id !== id));
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert(t('reminders.error'), t('reminders.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  // Add or update reminder
  const saveReminder = async () => {
    if (!validateForm()) {
      return;
    }

    const user = auth().currentUser;
    if (!user) return;

    const reminderData = {
      title: newReminder.title.trim(),
      amount: parseFloat(newReminder.amount),
      dueDate: newReminder.dueDate,
      isEnabled: true,
      category: newReminder.category,
    };

    try {
      if (editingReminder) {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('reminders')
          .doc(editingReminder.id)
          .update(reminderData);

        setReminders((prev) =>
          prev.map((r) =>
            r.id === editingReminder.id ? { ...r, ...reminderData } : r
          )
        );
      } else {
        const docRef = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('reminders')
          .add(reminderData);

        setReminders((prev) => [...prev, { id: docRef.id, ...reminderData }]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert(t('reminders.error'), t('reminders.saveFailed'));
    }
  };

  const resetForm = () => {
    setNewReminder({ title: '', amount: '', dueDate: new Date().getDate().toString(), category: 'bill' });
    setErrors({});
    setShowAddForm(false);
    setEditingReminder(null);
    setSelectedDate(new Date());
  };

  const startEditing = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      title: reminder.title,
      amount: reminder.amount.toString(),
      dueDate: reminder.dueDate,
      category: reminder.category,
    });
    // Set date picker to the reminder's due date
    const date = new Date();
    date.setDate(parseInt(reminder.dueDate, 10));
    setSelectedDate(date);
    setErrors({});
    setShowAddForm(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setNewReminder((prev) => ({ ...prev, dueDate: date.getDate().toString() }));
      setErrors((prev) => ({ ...prev, dueDate: undefined }));
    }
  };

  const getCategoryEmoji = (category: string) => {
    return REMINDER_CATEGORIES.find((c) => c.id === category)?.emoji || '📌';
  };

  const totalMonthlyReminders = reminders
    .filter((r) => r.isEnabled)
    .reduce((sum, r) => sum + r.amount, 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48BB78" />
          <Text style={styles.loadingText}>{t('reminders.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('reminders.title')}</Text>
        <TouchableOpacity onPress={() => { resetForm(); setShowAddForm(true); }} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#48BB78" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48BB78" />
        }
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <MaterialIcons name="notifications-active" size={32} color="#fff" />
          </View>
          <Text style={[styles.summaryLabel, { fontSize: fontSize.small }]}>
            {t('reminders.monthlyTotal')}
          </Text>
          <Text style={[styles.summaryAmount, { fontSize: fontSize.xlarge }]}>
            RM {totalMonthlyReminders.toFixed(2)}
          </Text>
          <Text style={[styles.summaryCount, { fontSize: fontSize.small }]}>
            {t('reminders.activeCount', { count: reminders.filter((r) => r.isEnabled).length })}
          </Text>
        </View>

        {showAddForm && (
          <View style={styles.addFormCard}>
            <Text style={[styles.formTitle, { fontSize: fontSize.medium }]}>
              {editingReminder ? t('reminders.update') : t('reminders.addNew')}
            </Text>

            <TextInput
              style={[styles.input, errors.title && styles.inputError, { fontSize: fontSize.medium }]}
              placeholder={t('reminders.reminderName')}
              placeholderTextColor="#94A3B8"
              value={newReminder.title}
              onChangeText={(text) => {
                setNewReminder((prev) => ({ ...prev, title: text }));
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

            <TextInput
              style={[styles.input, errors.amount && styles.inputError, { fontSize: fontSize.medium }]}
              placeholder={t('reminders.amount')}
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={newReminder.amount}
              onChangeText={(text) => {
                setNewReminder((prev) => ({ ...prev, amount: text }));
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

            <TouchableOpacity
              style={[styles.datePickerButton, errors.dueDate && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#48BB78" />
              <Text style={[styles.datePickerText, { fontSize: fontSize.medium }]}>
                {t('reminders.everyMonth', { day: newReminder.dueDate })}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
            {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}

            <Text style={[styles.categoryLabel, { fontSize: fontSize.small }]}>{t('reminders.category')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
              style={styles.categoryScroll}
            >
              {REMINDER_CATEGORIES.map((cat, index) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    newReminder.category === cat.id && styles.categoryButtonActive,
                    index === REMINDER_CATEGORIES.length - 1 && { marginRight: 0 },
                  ]}
                  onPress={() => setNewReminder((prev) => ({ ...prev, category: cat.id }))}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryText, { fontSize: fontSize.small }]}>{t(cat.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>{t('reminders.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={saveReminder}
              >
                <Text style={styles.saveButtonText}>
                  {editingReminder ? t('reminders.update') : t('reminders.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>
          {t('reminders.list')}
        </Text>

        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-off" size={64} color="#CBD5E1" />
            <Text style={[styles.emptyStateText, { fontSize: fontSize.medium }]}>
              {t('reminders.empty')}
            </Text>
            <Text style={[styles.emptyStateSubtext, { fontSize: fontSize.small }]}>
              {t('reminders.emptySubtitle')}
            </Text>
          </View>
        ) : (
          reminders.map((reminder) => (
            <TouchableOpacity
              key={reminder.id}
              style={[styles.reminderCard, !reminder.isEnabled && styles.reminderCardDisabled]}
              onPress={() => startEditing(reminder)}
              activeOpacity={0.7}
            >
              <View style={styles.reminderLeft}>
                <View style={[styles.reminderIconContainer, { backgroundColor: reminder.isEnabled ? '#E8F5E9' : '#F1F5F9' }]}>
                  <Text style={styles.reminderEmoji}>{getCategoryEmoji(reminder.category)}</Text>
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderTitle, { fontSize: fontSize.medium }, !reminder.isEnabled && styles.textDisabled]}>
                    {reminder.title}
                  </Text>
                  <Text style={[styles.reminderDue, { fontSize: fontSize.small }]}>
                    {t('reminders.everyMonth', { day: reminder.dueDate })}
                  </Text>
                </View>
              </View>
              <View style={styles.reminderRight}>
                <Text style={[styles.reminderAmount, { fontSize: fontSize.medium }, !reminder.isEnabled && styles.textDisabled]}>
                  RM {reminder.amount.toFixed(2)}
                </Text>
                <View style={styles.reminderActions}>
                  <Switch
                    value={reminder.isEnabled}
                    onValueChange={() => toggleReminder(reminder.id, reminder.isEnabled)}
                    trackColor={{ false: '#E2E8F0', true: '#48BB78' }}
                    thumbColor="#fff"
                  />
                  <TouchableOpacity onPress={() => deleteReminder(reminder.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancel}>{t('reminders.cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{t('reminders.datePicker.title')}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDone}>{t('reminders.datePicker.done')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#48BB78',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  summaryAmount: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 8,
  },
  summaryCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  addFormCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
  },
  datePickerText: {
    flex: 1,
    marginLeft: 10,
    color: '#1F2937',
  },
  categoryLabel: {
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryScrollContent: {
    paddingRight: 8,
  },
  categoryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
    minWidth: 72,
  },
  categoryButtonActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#48BB78',
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  categoryText: {
    color: '#64748B',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#48BB78',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#64748B',
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#94A3B8',
    marginTop: 4,
  },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderCardDisabled: {
    opacity: 0.6,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderEmoji: {
    fontSize: 24,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontWeight: '600',
    color: '#1F2937',
  },
  reminderDue: {
    color: '#64748B',
    marginTop: 2,
  },
  textDisabled: {
    color: '#94A3B8',
  },
  reminderRight: {
    alignItems: 'flex-end',
  },
  reminderAmount: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#48BB78',
  },
});

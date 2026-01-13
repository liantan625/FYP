import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
  status: 'active' | 'closed';
}

type ModalMode = 'create' | 'update' | null;

const SavingsGoalScreen: React.FC = () => {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Form state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('savings_goals')
        .where('status', '==', 'active')
        .onSnapshot(querySnapshot => {
          const goalsData: SavingsGoal[] = [];
          querySnapshot.forEach(doc => {
            goalsData.push({ id: doc.id, ...doc.data() } as SavingsGoal);
          });
          setGoals(goalsData);
          setLoading(false);
        }, error => {
          console.error('Error fetching goals:', error);
          setLoading(false);
        });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    setTargetDate(selectedDate);
    hideDatePicker();
  };

  // Validate amount input - only allow numbers with at most 2 decimal places
  const handleAmountChange = (text: string, setter: (value: string) => void) => {
    // Remove any non-numeric characters except decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    setter(cleaned);
  };

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate(new Date());
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setSelectedGoal(null);
    setModalVisible(true);
  };

  const openUpdateModal = (goal: SavingsGoal) => {
    setGoalName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(new Date(goal.targetDate));
    setModalMode('update');
    setSelectedGoal(goal);
    setModalVisible(true);
  };

  const handleCreate = () => {
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (!goalName || !targetAmount || !targetDate) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.fillRequired'));
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(targetDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.pastDate'));
      return;
    }

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.invalidTarget'));
      return;
    }

    if (currentAmount && (isNaN(parsedCurrent) || parsedCurrent < 0)) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.invalidCurrent'));
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.loginRequired'));
      return;
    }

    firestore()
      .collection('users')
      .doc(user.uid)
      .collection('savings_goals')
      .add({
        name: goalName,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate: targetDate.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        status: 'active',
      });

    setModalVisible(false);
    resetForm();
    Alert.alert(t('savingsGoals.success'), t('savingsGoals.goalCreated'));
  };

  const handleUpdate = () => {
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (!selectedGoal || !goalName || !targetAmount || !targetDate) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.fillRequired'));
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(targetDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.pastDate'));
      return;
    }

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.invalidTarget'));
      return;
    }

    if (currentAmount && (isNaN(parsedCurrent) || parsedCurrent < 0)) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.invalidCurrent'));
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert(t('savingsGoals.error'), t('savingsGoals.loginRequired'));
      return;
    }

    firestore()
      .collection('users')
      .doc(user.uid)
      .collection('savings_goals')
      .doc(selectedGoal.id)
      .update({
        name: goalName,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate: targetDate.toISOString().split('T')[0],
      });

    setModalVisible(false);
    resetForm();
    Alert.alert(t('savingsGoals.success'), t('savingsGoals.goalUpdated'));
  };

  const handleClose = (goalId: string) => {
    Alert.alert(
      t('savingsGoals.closeGoalTitle'),
      t('savingsGoals.closeGoalMessage'),
      [
        { text: t('savingsGoals.cancel'), style: 'cancel' },
        {
          text: t('savingsGoals.close'),
          style: 'destructive',
          onPress: () => {
            const user = auth().currentUser;
            if (!user) {
              Alert.alert(t('savingsGoals.error'), t('savingsGoals.loginRequired'));
              return;
            }

            firestore()
              .collection('users')
              .doc(user.uid)
              .collection('savings_goals')
              .doc(goalId)
              .update({
                status: 'closed',
              });

            Alert.alert(t('savingsGoals.success'), t('savingsGoals.goalClosed'));
          },
        },
      ]
    );
  };

  const calculateProgress = (goal: SavingsGoal): number => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return '#48BB78';
    if (progress >= 70) return '#48BB78';
    if (progress >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const totalSavings = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  const renderGoalCard = (goal: SavingsGoal) => {
    const progress = calculateProgress(goal);
    const progressColor = getProgressColor(progress);
    const isClosed = goal.status === 'closed';

    return (
      <View key={goal.id} style={[styles.goalCard, isClosed && styles.closedCard]}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconContainer}>
            <MaterialIcons name="flag" size={22} color="#48BB78" />
          </View>
          <View style={styles.goalTitleContainer}>
            <Text style={[styles.goalName, { fontSize: fontSize.medium }]} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={[styles.targetDate, { fontSize: fontSize.small }]}>
              {t('savingsGoals.targetDate')}: {goal.targetDate}
            </Text>
          </View>
          {isClosed && (
            <View style={styles.closedBadge}>
              <Text style={[styles.closedBadgeText, { fontSize: fontSize.small }]}>
                {t('savingsGoals.closed')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.currentAmount, { fontSize: fontSize.xlarge }]}>
            RM {goal.currentAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.targetAmount, { fontSize: fontSize.small }]}>
            {t('savingsGoals.of')} RM {goal.targetAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }]} />
          </View>
          <Text style={[styles.progressText, { fontSize: fontSize.small, color: progressColor }]}>
            {progress.toFixed(1)}% {t('savingsGoals.complete')}
          </Text>
        </View>

        {!isClosed && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => openUpdateModal(goal)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={18} color="#3B82F6" />
              <Text style={[styles.updateButtonText, { fontSize: fontSize.small }]}>
                {t('savingsGoals.update')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleClose(goal.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={18} color="#EF4444" />
              <Text style={[styles.closeButtonText, { fontSize: fontSize.small }]}>
                {t('savingsGoals.close')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48BB78" />
          <Text style={[styles.loadingText, { fontSize: fontSize.medium }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('savingsGoals.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <MaterialIcons name="savings" size={28} color="#fff" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={[styles.summaryTitle, { fontSize: fontSize.medium }]}>
            {t('savingsGoals.summaryTitle')}
          </Text>
          <Text style={[styles.summaryAmount, { fontSize: fontSize.xlarge }]}>
            RM {totalSavings.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.summarySubtitle, { fontSize: fontSize.small }]}>
            {goals.length} {t('savingsGoals.summarySubtitle')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48BB78" />
        }
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="flag" size={48} color="#CBD5E1" />
            </View>
            <Text style={[styles.emptyStateText, { fontSize: fontSize.medium }]}>
              {t('savingsGoals.noGoals')}
            </Text>
            <Text style={[styles.emptyStateSubtext, { fontSize: fontSize.small }]}>
              {t('savingsGoals.noGoalsSubtext')}
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={openCreateModal}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={[styles.createFirstButtonText, { fontSize: fontSize.medium }]}>
                {t('savingsGoals.createGoal')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map(renderGoalCard)
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: fontSize.large }]}>
                {modalMode === 'create' ? t('savingsGoals.createGoal') : t('savingsGoals.updateGoal')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <MaterialIcons name="label" size={18} color="#48BB78" />
                  <Text style={[styles.label, { fontSize: fontSize.medium }]}>
                    {t('savingsGoals.goalName')} *
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: fontSize.medium }]}
                  placeholder={t('savingsGoals.goalNamePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={goalName}
                  onChangeText={setGoalName}
                />
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <MaterialIcons name="attach-money" size={18} color="#48BB78" />
                  <Text style={[styles.label, { fontSize: fontSize.medium }]}>
                    {t('savingsGoals.targetAmount')} * (RM)
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: fontSize.medium }]}
                  placeholder={t('savingsGoals.enterAmount') || 'Enter amount'}
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={targetAmount}
                  onChangeText={(text) => handleAmountChange(text, setTargetAmount)}
                />
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <MaterialIcons name="account-balance-wallet" size={18} color="#48BB78" />
                  <Text style={[styles.label, { fontSize: fontSize.medium }]}>
                    {t('savingsGoals.currentAmount')} (RM)
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { fontSize: fontSize.medium }]}
                  placeholder={t('savingsGoals.enterAmount') || 'Enter amount'}
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={currentAmount}
                  onChangeText={(text) => handleAmountChange(text, setCurrentAmount)}
                />
              </View>

              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <MaterialIcons name="calendar-today" size={18} color="#48BB78" />
                  <Text style={[styles.label, { fontSize: fontSize.medium }]}>
                    {t('savingsGoals.targetDate')} *
                  </Text>
                </View>
                <TouchableOpacity onPress={showDatePicker} style={styles.dateInput}>
                  <Text style={[styles.dateText, { fontSize: fontSize.medium }]}>
                    {targetDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={[styles.cancelButtonText, { fontSize: fontSize.medium }]}>
                  {t('savingsGoals.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={modalMode === 'create' ? handleCreate : handleUpdate}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={[styles.saveButtonText, { fontSize: fontSize.medium }]}>
                  {modalMode === 'create' ? t('savingsGoals.create') : t('savingsGoals.update')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          minimumDate={new Date()}
        />
      </Modal>

      {/* FAB */}
      {goals.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.8}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48BB78',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    marginLeft: 14,
    flex: 1,
  },
  summaryTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  summaryAmount: {
    color: '#fff',
    fontWeight: '700',
    marginVertical: 2,
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48BB78',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  goalCard: {
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
  closedCard: {
    opacity: 0.6,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalName: {
    fontWeight: '600',
    color: '#1F2937',
  },
  targetDate: {
    color: '#64748B',
    marginTop: 2,
  },
  closedBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  closedBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  amountContainer: {
    marginBottom: 12,
  },
  currentAmount: {
    fontWeight: '700',
    color: '#48BB78',
  },
  targetAmount: {
    color: '#64748B',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  updateButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 6,
  },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  closeButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '85%',
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
    fontWeight: '700',
    color: '#1F2937',
  },
  modalForm: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    color: '#1F2937',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#48BB78',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 90,
    backgroundColor: '#48BB78',
    borderRadius: 30,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default SavingsGoalScreen;
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
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
          const goalsData = [];
          querySnapshot.forEach(doc => {
            goalsData.push({ id: doc.id, ...doc.data() });
          });
          setGoals(goalsData);
        });

      return () => unsubscribe();
    }
  }, []);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate) => {
    setTargetDate(selectedDate);
    hideDatePicker();
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
      Alert.alert('Ralat', 'Sila isi semua medan yang diperlukan');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(targetDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      Alert.alert('Ralat', 'Tarikh sasaran tidak boleh berada pada masa lalu');
      return;
    }

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      Alert.alert('Ralat', 'Sila masukkan jumlah sasaran yang sah (lebih besar daripada 0)');
      return;
    }

    if (currentAmount && (isNaN(parsedCurrent) || parsedCurrent < 0)) {
      Alert.alert('Ralat', 'Sila masukkan jumlah semasa yang sah (0 atau lebih)');
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a savings goal.');
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
        targetDate: targetDate.toISOString().split('T')[0], // Store as YYYY-MM-DD
        createdAt: new Date().toISOString(),
        status: 'active',
      });

    setModalVisible(false);
    resetForm();
    Alert.alert('Berjaya', 'Matlamat simpanan berjaya dicipta!');
  };

  const handleUpdate = () => {
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (!selectedGoal || !goalName || !targetAmount || !targetDate) {
      Alert.alert('Ralat', 'Sila isi semua medan yang diperlukan');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(targetDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      Alert.alert('Ralat', 'Tarikh sasaran tidak boleh berada pada masa lalu');
      return;
    }

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      Alert.alert('Ralat', 'Sila masukkan jumlah sasaran yang sah (lebih besar daripada 0)');
      return;
    }

    if (currentAmount && (isNaN(parsedCurrent) || parsedCurrent < 0)) {
      Alert.alert('Ralat', 'Sila masukkan jumlah semasa yang sah (0 atau lebih)');
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update a savings goal.');
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
        targetDate: targetDate.toISOString().split('T')[0], // Store as YYYY-MM-DD
      });

    setModalVisible(false);
    resetForm();
    Alert.alert('Berjaya', 'Matlamat simpanan berjaya dikemas kini!');
  };

  const handleClose = (goalId: string) => {
    Alert.alert(
      'Tutup Matlamat',
      'Adakah anda pasti mahu menutup matlamat simpanan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tutup',
          style: 'destructive',
          onPress: () => {
            const user = auth().currentUser;
            if (!user) {
              Alert.alert('Error', 'You must be logged in to close a savings goal.');
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

            Alert.alert('Berjaya', 'Matlamat simpanan berjaya ditutup!');
          },
        },
      ]
    );
  };

  const calculateProgress = (goal: SavingsGoal): number => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const renderGoalCard = (goal: SavingsGoal) => {
    const progress = calculateProgress(goal);
    const isClosed = goal.status === 'closed';

    return (
      <View key={goal.id} style={[styles.goalCard, isClosed && styles.closedCard]}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalName}>{goal.name}</Text>
          {isClosed && <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>DITUTUP</Text>
          </View>}
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.currentAmount}>RM{goal.currentAmount.toFixed(2)}</Text>
          <Text style={styles.targetAmount}>daripada RM{goal.targetAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress.toFixed(1)}% Selesai</Text>

        <Text style={styles.targetDate}>Tarikh Sasaran: {goal.targetDate}</Text>

        {!isClosed && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={() => openUpdateModal(goal)}
            >
              <Text style={styles.buttonText}>Kemas Kini</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]} onPress={() => handleClose(goal.id)}
            >
              <Text style={styles.buttonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Matlamat Simpanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Tiada matlamat simpanan lagi</Text>
            <Text style={styles.emptyStateSubtext}>Cipta matlamat pertama anda untuk bermula!</Text>
          </View>
        ) : (
          goals.map(renderGoalCard)
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Cipta Matlamat Simpanan' : 'Kemas Kini Matlamat Simpanan'}
            </Text>

            <Text style={styles.label}>Nama Matlamat *</Text>
            <TextInput
              style={styles.input}
              placeholder="cth: Dana Kecemasan, Percutian"
              value={goalName}
              onChangeText={setGoalName}
            />

            <Text style={styles.label}>Jumlah Sasaran * (RM)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            <Text style={styles.label}>Jumlah Semasa (RM)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={currentAmount}
              onChangeText={setCurrentAmount}
            />

            <Text style={styles.label}>Tarikh Sasaran *</Text>
            <TouchableOpacity onPress={showDatePicker} style={styles.input}>
              <Text>{targetDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={modalMode === 'create' ? handleCreate : handleUpdate}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  {modalMode === 'create' ? 'Cipta' : 'Kemas Kini'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closedCard: {
    opacity: 0.7,
    backgroundColor: '#f9f9f9',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closedBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 8,
  },
  targetAmount: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  targetDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  closeButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 90,
    backgroundColor: '#00D9A8',
    borderRadius: 28,
    elevation: 8,
  },
});

export default SavingsGoalScreen;
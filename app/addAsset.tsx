import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
import { useTranslation } from 'react-i18next';

const defaultCurrency = "MYR";

export default function AddAssetScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const fontSize = useScaledFontSize();
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Dynamic default categories
  const defaultAssetCategories = [
    { label: t('asset.bank'), value: "bank" },
    { label: t('asset.investment'), value: "investment" },
    { label: t('asset.property'), value: "property" },
    { label: t('asset.income'), value: "income" },
    { label: t('asset.others'), value: "others" }
  ];

  const [assetCategories, setAssetCategories] = useState(defaultAssetCategories);

  // Load custom asset categories on mount
  useEffect(() => {
    loadCustomAssetCategories();
  }, [i18n.language]); // Reload when language changes

  const loadCustomAssetCategories = async () => {
    try {
      const customCategoriesJson = await AsyncStorage.getItem('customAssetCategories');
      if (customCategoriesJson) {
        const customCategories = JSON.parse(customCategoriesJson);
        // Combine translated defaults + custom categories
        setAssetCategories([...defaultAssetCategories, ...customCategories]);
      } else {
        setAssetCategories(defaultAssetCategories);
      }
    } catch (error) {
      console.error('Error loading custom asset categories:', error);
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
  const [assetName, setAssetName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurringIncome, setIsRecurringIncome] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);

  // Validate amount input - only allow numbers with at most 2 decimal places
  const handleAmountChange = (text: string) => {
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
    setAmount(cleaned);
  };

  const getSelectedCategoryLabel = () => {
    const selected = assetCategories.find(c => c.value === category);
    return selected ? selected.label : t('addAsset.selectPlaceholder');
  };

  const handleSave = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert(t('addAsset.errorTitle'), t('addAsset.loginRequired'));
      return;
    }

    if (!category) {
      Alert.alert(t('addAsset.errorTitle'), t('addAsset.categoryRequired'));
      return;
    }

    if (!assetName || assetName.trim() === '') {
      Alert.alert(t('addAsset.errorTitle'), t('addAsset.nameRequired'));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('addAsset.errorTitle'), t('addAsset.amountRequired'));
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .add({
          date,
          category,
          assetName,
          amount: parseFloat(amount),
          description,
          isRecurringIncome,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      // Add notification
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notifications')
        .add({
          title: t('addAsset.successTitle'),
          message: `${t('addAsset.successMessage')} '${assetName}' (RM ${parseFloat(amount).toFixed(2)})`,
          type: 'asset',
          createdAt: firestore.FieldValue.serverTimestamp(),
          read: false,
          amount: parseFloat(amount),
          category: category,
        });

      Toast.show({
        type: 'success',
        text1: t('addAsset.successTitle'),
        text2: t('addAsset.successMessage'),
      });
      router.back();
    } catch (error) {
      console.error('Error adding asset: ', error);
      Alert.alert(t('addAsset.errorTitle'), t('addAsset.errorMessage'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('addAsset.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#fff" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={[styles.summaryTitle, { fontSize: fontSize.medium }]}>{t('addAsset.summaryTitle')}</Text>
          <Text style={[styles.summarySubtitle, { fontSize: fontSize.small }]}>{t('addAsset.summarySubtitle')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.form}>
            {/* Date Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <MaterialIcons name="calendar-today" size={20} color="#48BB78" />
                <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.dateLabel')}</Text>
              </View>
              <TouchableOpacity onPress={showDatePicker} style={styles.inputContainer}>
                <Text style={[styles.inputText, { fontSize: fontSize.medium }]}>{date.toLocaleDateString(i18n.language === 'ms' ? 'ms-MY' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />

            {/* Category Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <MaterialIcons name="folder" size={20} color="#48BB78" />
                <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.categoryLabel')}</Text>
              </View>
              {Platform.OS === 'ios' ? (
                <>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setPickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.inputText,
                        {
                          fontSize: fontSize.medium,
                          color: category ? '#1F2937' : '#94A3B8',
                        }
                      ]}
                    >
                      {getSelectedCategoryLabel()}
                    </Text>
                    <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                  <Modal
                    visible={isPickerVisible}
                    transparent={true}
                    animationType="slide"
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>{t('addAsset.selectCategory')}</Text>
                          <TouchableOpacity onPress={() => setPickerVisible(false)}>
                            <Text style={styles.doneButtonText}>{t('common.confirm')}</Text>
                          </TouchableOpacity>
                        </View>
                        <Picker
                          selectedValue={category}
                          onValueChange={(itemValue) => setCategory(itemValue)}
                        >
                          <Picker.Item label={t('addAsset.selectPlaceholder')} value={null} />
                          {assetCategories.map((item) => (
                            <Picker.Item key={item.value} label={item.label} value={item.value} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </Modal>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.inputContainer}
                  activeOpacity={0.7}
                >
                  <RNPickerSelect
                    onValueChange={(value) => setCategory(value)}
                    items={assetCategories}
                    value={category}
                    placeholder={{ label: t('addAsset.selectPlaceholder'), value: null }}
                    style={{
                      ...pickerSelectStyles(fontSize.fontScale),
                      iconContainer: {
                        top: 18,
                        right: 0,
                      },
                      viewContainer: {
                        flex: 1,
                      },
                    }}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => <MaterialIcons name="keyboard-arrow-down" size={24} color="#94A3B8" />}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Asset Name Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <MaterialIcons name="label" size={20} color="#48BB78" />
                <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.nameLabel')}</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, { fontSize: fontSize.medium }]}
                  placeholder={t('addAsset.namePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={assetName}
                  onChangeText={setAssetName}
                />
              </View>
            </View>

            {/* Amount Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <MaterialIcons name="attach-money" size={20} color="#48BB78" />
                <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.amountLabel')}</Text>
              </View>
              <View style={styles.amountContainer}>
                <View style={styles.currencyBadge}>
                  <Text style={[styles.currencyLabel, { fontSize: fontSize.medium }]}>RM</Text>
                </View>
                <TextInput
                  style={[styles.amountInput, { fontSize: fontSize.large }]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Description Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <MaterialIcons name="notes" size={20} color="#48BB78" />
                <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.descriptionLabel')}</Text>
              </View>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.textInput, styles.textArea, { fontSize: fontSize.medium }]}
                  placeholder={t('addAsset.descriptionPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>
            </View>

            {/* Recurring Income Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsRecurringIncome(!isRecurringIncome)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isRecurringIncome && styles.checkboxChecked]}>
                {isRecurringIncome && (
                  <MaterialIcons name="check" size={18} color="#fff" />
                )}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={[styles.checkboxLabel, { fontSize: fontSize.medium }]}>
                  {t('addAsset.recurringIncome')}
                </Text>
                <Text style={[styles.checkboxHint, { fontSize: fontSize.small }]}>
                  {t('addAsset.recurringIncomeHint')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <MaterialIcons name="save" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={[styles.saveButtonText, { fontSize: fontSize.medium }]}>{t('addAsset.saveButton')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#fff',
    fontWeight: '700',
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  form: {
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputText: {
    flex: 1,
    color: '#1F2937',
    paddingVertical: 16,
  },
  textInput: {
    flex: 1,
    color: '#1F2937',
    paddingVertical: 16,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  currencyBadge: {
    backgroundColor: '#48BB78',
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyLabel: {
    fontWeight: '700',
    color: '#fff',
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#48BB78',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: '#48BB78',
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontWeight: '600',
    color: '#1F2937',
  },
  checkboxHint: {
    color: '#64748B',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#48BB78',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  doneButtonText: {
    color: '#48BB78',
    fontWeight: '700',
    fontSize: 16,
  },
});

const pickerSelectStyles = (fontScale: number) => StyleSheet.create({
  inputIOS: {
    fontSize: 16 * fontScale,
    paddingVertical: 16,
    paddingHorizontal: 0,
    color: '#1F2937',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16 * fontScale,
    paddingHorizontal: 0,
    paddingVertical: 16,
    color: '#1F2937',
    paddingRight: 30,
  },
  placeholder: {
    color: '#94A3B8',
  },
});
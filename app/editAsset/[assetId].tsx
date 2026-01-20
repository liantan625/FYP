
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
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export default function EditAssetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { assetId } = params;
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [asset, setAsset] = useState<any>(null);
  const [assetName, setAssetName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

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

  useEffect(() => {
    const user = auth().currentUser;
    if (user && assetId) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .doc(assetId as string)
        .onSnapshot(doc => {
          const assetData = doc.data();
          if (assetData) {
            setAsset(assetData);
            setAssetName(assetData?.assetName || '');
            setAmount(assetData?.amount ? assetData.amount.toString() : '');
            setDescription(assetData?.description || '');
          }
        });

      return () => unsubscribe();
    }
  }, [assetId]);

  const handleUpdate = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert(t('common.error'), t('addAsset.loginRequired'));
      return;
    }

    if (!assetName || assetName.trim() === '') {
      Alert.alert(t('common.error'), t('addAsset.nameRequired'));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('addAsset.amountRequired'));
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('assets')
        .doc(assetId as string)
        .update({
          assetName,
          amount: parseFloat(amount),
          description,
        });

      Alert.alert(t('common.success'), t('addAsset.successMessage'));
      router.back();
    } catch (error) {
      console.error('Error updating asset: ', error);
      Alert.alert(t('common.error'), t('addAsset.errorMessage'));
    }
  };

  const handleDelete = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert(t('common.error'), t('addAsset.loginRequired'));
      return;
    }

    Alert.alert(
      t('common.delete'),
      t('reminders.deleteMessage'), // Reuse "Are you sure..."
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          onPress: async () => {
            try {
              await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('assets')
                .doc(assetId as string)
                .delete();

              Alert.alert(t('common.delete'), t('reminders.deleteFailed').replace('Failed', 'Success'));
              router.back();
            } catch (error) {
              console.error('Error deleting asset: ', error);
              Alert.alert(t('common.error'), t('addAsset.errorMessage'));
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  if (!asset) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]} accessibilityRole="header">
          {t('asset.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.form}>
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.nameLabel')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              value={assetName}
              onChangeText={setAssetName}
              placeholder={t('addAsset.namePlaceholder')}
              placeholderTextColor="#94A3B8"
              accessibilityLabel={t('addAsset.nameLabel')}
            />
          </View>

          <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.amountLabel')}</Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.currencyLabel, { fontSize: fontSize.medium }]}>MYR</Text>
            <TextInput
              style={[styles.amountInput, { fontSize: fontSize.medium }]}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#94A3B8"
              accessibilityLabel={t('addAsset.amountLabel')}
            />
          </View>

          <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('addAsset.descriptionLabel')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea, { fontSize: fontSize.medium }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder={t('addAsset.descriptionPlaceholder')}
              placeholderTextColor="#94A3B8"
              accessibilityLabel={t('addAsset.descriptionLabel')}
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdate}
            accessibilityLabel={t('common.save')}
            accessibilityRole="button"
          >
            <Text style={[styles.saveButtonText, { fontSize: fontSize.medium }]}>{t('common.save')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityLabel={t('common.delete')}
            accessibilityRole="button"
          >
            <Text style={[styles.deleteButtonText, { fontSize: fontSize.medium }]}>{t('common.delete')}</Text>
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
    backgroundColor: '#48BB78',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#fff',
  },
  container: {
    flexGrow: 1,
  },
  form: {
    padding: 24,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    padding: 16,
    color: '#1F2937',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  currencyLabel: {
    padding: 16,
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
    color: '#475569',
  },
  amountInput: {
    flex: 1,
    padding: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#48BB78',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

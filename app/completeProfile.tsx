import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useScaledFontSize } from '@/hooks/use-scaled-font';

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const fontSize = useScaledFontSize();
  const router = useRouter();
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    setBirthday(date);
    hideDatePicker();
  };

  const handleSaveProfile = async () => {
    if (!name || !idNumber || !birthday) {
      Alert.alert(t('common.error'), t('signup.fillAllFields'));
      return;
    }

    if (idNumber.length !== 12 && !/^[A-Z]/.test(idNumber)) {
      Alert.alert(t('common.error'), t('signup.invalidId'));
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert(t('common.error'), 'User not found. Please login again.');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const birthdayString = birthday.toLocaleDateString('en-GB');
      
      await firestore().collection('users').doc(user.uid).set({
        name,
        idNumber,
        birthday: birthdayString,
        email: user.email,
        phoneNumber: user.phoneNumber, // Might be null for Google Sign-In
        createdAt: firestore.FieldValue.serverTimestamp(),
        authProvider: 'google',
      }, { merge: true });

      Alert.alert(t('common.success'), 'Profile completed successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t('common.error'), 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: fontSize.heading}]}>Lengkapkan Profil Anda</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.description, { fontSize: fontSize.body }]}>
            Please provide a few more details to complete your registration.
          </Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { fontSize: fontSize.body }]}
              placeholder={t('signup.fullName')}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="badge" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { fontSize: fontSize.body }]}
              placeholder={t('signup.idNumber')}
              value={idNumber}
              onChangeText={setIdNumber}
              keyboardType="number-pad"
              maxLength={12}
            />
          </View>

          <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
             <View style={styles.inputContainer}>
                <MaterialIcons name="calendar-today" size={24} color="#666" style={styles.inputIcon} />
                <Text style={[styles.dateText, { fontSize: fontSize.body, color: birthday ? '#333' : '#999' }]}>
                  {birthday ? birthday.toLocaleDateString('en-GB') : t('signup.birthDate')}
                </Text>
             </View>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
            maximumDate={new Date()}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { fontSize: fontSize.medium }]}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerTitle: {

    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center'
  },
  content: {
    padding: 24,
  },
  description: {
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
  },
  dateButton: {
    marginBottom: 15,
  },
  dateText: {
    paddingVertical: 15,
  },
  button: {
    backgroundColor: '#00D09E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a9a9a9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

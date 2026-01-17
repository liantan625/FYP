import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, Modal } from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data();
            setName(data?.name || '');
            const savedBirthday = data?.birthday || '';
            setBirthday(savedBirthday);

            // Try to parse saved birthday or default to current date
            if (savedBirthday) {
              // Assuming format DD/MM/YYYY or similar string
              const parts = savedBirthday.split('/');
              if (parts.length === 3) {
                // simple parsing for DD/MM/YYYY
                const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                if (!isNaN(d.getTime())) {
                  setDate(d);
                }
              }
            }
          }
          setLoading(false);
        });

      return () => unsubscribe();
    }
  }, []);

  const handleSave = async () => {
    const user = auth().currentUser;
    if (user) {
      try {
        await firestore().collection('users').doc(user.uid).update({
          name: name,
          birthday: birthday,
        });
        Alert.alert(t('editProfile.success'), t('editProfile.profileUpdated'), [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (error) {
        console.error('Error updating profile: ', error);
        Alert.alert(t('editProfile.error'), t('editProfile.updateFailed'));
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
      // Format as DD/MM/YYYY
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setBirthday(`${day}/${month}/${year}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('editProfile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View>
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('editProfile.fullName')}</Text>
          <TextInput
            style={[styles.input, { fontSize: fontSize.medium }]}
            placeholder={t('editProfile.fullName')}
            value={name}
            onChangeText={setName}
          />
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('editProfile.birthday')}</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                style={[styles.input, { fontSize: fontSize.medium }]}
                placeholder={t('editProfile.birthdayPlaceholder')}
                value={birthday}
                editable={false}
              />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { fontSize: fontSize.medium }]}>{t('editProfile.save')}</Text>
        </TouchableOpacity>
      </View>

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
                  <Text style={[styles.modalCancel, { fontSize: fontSize.medium }]}>{t('reminders.cancel')}</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { fontSize: fontSize.medium }]}>{t('editProfile.birthday')}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.modalDone, { fontSize: fontSize.medium }]}>{t('reminders.datePicker.done')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
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
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#48BB78',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    color: '#EF4444',
    fontSize: 16,
  },
  modalDone: {
    color: '#48BB78',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

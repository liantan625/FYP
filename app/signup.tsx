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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../context/auth-context';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MaterialIcons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const router = useRouter();
  const { setConfirmation } = useAuth();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [repeatPasscode, setRepeatPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    setBirthday(selectedDate);
    hideDatePicker();
  };

  const handleSignUp = async () => {
    if (!name || !phoneNumber || !idNumber || !birthday || !passcode || !repeatPasscode) {
      Alert.alert('Ralat', 'Sila isi semua ruangan');
      return;
    }
    
    const birthdayString = birthday.toLocaleDateString('en-GB');
    if (passcode !== repeatPasscode) {
      Alert.alert('Ralat', 'Kod laluan tidak sepadan');
      return;
    }
    if (passcode.length !== 6) {
      Alert.alert('Ralat', 'Kod laluan mestilah 6 digit');
      return;
    }
    if (idNumber.length !== 12 && !/^[A-Z]/.test(idNumber)) {
      Alert.alert('Ralat', 'Sila masukkan nombor IC 12-digit atau nombor Pasport yang sah');
      return;
    }
  
    setLoading(true);
    try {
      const fullPhoneNumber = `+60${phoneNumber}`;
      const confirm = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmation(confirm);
      router.push({
        pathname: '/(tabs)/OTP',
        params: { name, phoneNumber: fullPhoneNumber, idNumber, birthday: birthdayString, passcode, isSignUp: 'true' },
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Ralat', 'Gagal menghantar OTP. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Cipta Akaun</Text>
        <Text style={styles.subtitle}>Mulakan perjalanan kewangan anda</Text>

        <TextInput
          style={styles.input}
          placeholder="Nama Penuh"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.phoneInputContainer}>
          <Text style={styles.countryCode}>+60</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Nombor Telefon"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nombor IC 12-digit atau Pasport"
          value={idNumber}
          onChangeText={setIdNumber}
          autoCapitalize="characters"
        />

        <TouchableOpacity onPress={showDatePicker} style={styles.dateInputContainer}>
          <Text style={[styles.dateInput, !birthday && styles.dateInputPlaceholder]}>
            {birthday ? birthday.toLocaleDateString('en-GB') : 'Tarikh Lahir (DD/MM/YYYY)'}
          </Text>
          <MaterialIcons name="calendar-today" size={24} color="#666" style={styles.dateIcon} />
        </TouchableOpacity>
        
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          maximumDate={new Date()}
        />

        <TextInput
          style={styles.input}
          placeholder="Kod Laluan 6-digit"
          value={passcode}
          onChangeText={setPasscode}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />

        <TextInput
          style={styles.input}
          placeholder="Ulang Kod Laluan 6-digit"
          value={repeatPasscode}
          onChangeText={setRepeatPasscode}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Mencipta Akaun...' : 'Daftar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>
            Sudah ada akaun? <Text style={styles.linkTextBold}>Log Masuk</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  countryCode: {
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  dateInputPlaceholder: {
    color: '#999',
  },
  dateIcon: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#00D09E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#3299FF',
    fontWeight: '600',
  },
});

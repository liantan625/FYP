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

export default function SignUpScreen() {
  const router = useRouter();
  const { setConfirmation } = useAuth();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [repeatPasscode, setRepeatPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !phoneNumber || !idNumber || !passcode || !repeatPasscode) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (passcode !== repeatPasscode) {
      Alert.alert('Error', 'Passcodes do not match');
      return;
    }
    if (passcode.length !== 6) {
      Alert.alert('Error', 'Passcode must be 6 digits');
      return;
    }
    if (idNumber.length !== 12 && !/^[A-Z]/.test(idNumber)) {
      Alert.alert('Error', 'Please enter a valid 12-digit IC number or Passport number');
      return;
    }
  
    setLoading(true);
    try {
      const fullPhoneNumber = `+60${phoneNumber}`;
      const confirm = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmation(confirm);
      router.push({
        pathname: '/(tabs)/OTP',
        params: { name, phoneNumber: fullPhoneNumber, idNumber, passcode, isSignUp: 'true' },
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your financial journey</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.phoneInputContainer}>
          <Text style={styles.countryCode}>+60</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="12-digit IC or Passport Number"
          value={idNumber}
          onChangeText={setIdNumber}
          autoCapitalize="characters"
        />

        <TextInput
          style={styles.input}
          placeholder="6-digit Passcode"
          value={passcode}
          onChangeText={setPasscode}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />

        <TextInput
          style={styles.input}
          placeholder="Repeat 6-digit Passcode"
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
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

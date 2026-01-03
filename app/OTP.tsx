import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/auth-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Crypto from 'expo-crypto';

export default function OTPScreen() {
  const router = useRouter();
  const { confirmation, setConfirmation } = useAuth();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    try {
      const phoneNumber = params.phoneNumber as string;
      console.log(`Resending OTP to: ${phoneNumber}`);
      const confirm = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirmation(confirm);
      setTimer(60);
      Alert.alert('Berjaya', 'Kod OTP baharu telah dihantar.');
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert('Ralat', 'Gagal menghantar semula OTP. Sila cuba lagi kemudian.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmitOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Ralat', 'Sila masukkan OTP 6-digit yang sah.');
      return;
    }
    if (!confirmation) {
      Alert.alert('Ralat', 'Tidak dapat mengesahkan OTP. Sila cuba daftar semula.');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      const userCredential = await confirmation.confirm(otp);
      const user = userCredential.user;

      // If this is sign up, save user data to Firestore
      if (params.isSignUp === 'true' && user) {
        // Hash the passcode before storing for security
        const hashedPasscode = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          params.passcode as string
        );

        await firestore().collection('users').doc(user.uid).set({
          name: params.name,
          phoneNumber: params.phoneNumber,
          idNumber: params.idNumber,
          birthday: params.birthday,
          passcode: hashedPasscode, // Store hashed PIN
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      Alert.alert('Berjaya', 'Nombor telefon berjaya disahkan!', [
        { text: 'OK', onPress: () => router.replace('/successfulSignUp') }
      ]);
    } catch (error) {
      console.error('Error confirming OTP:', error);
      Alert.alert('Ralat', 'OTP tidak sah. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pengesahan OTP</Text>
      <Text style={styles.subtitle}>Masukkan kod 6-digit yang dihantar ke telefon anda.</Text>
      <TextInput
        style={styles.input}
        placeholder="OTP 6-digit"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmitOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Mengesahkan...' : 'Hantar OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendContainer}
        onPress={handleResendOtp}
        disabled={timer > 0 || isResending}
      >
        <Text style={[styles.resendText, (timer > 0 || isResending) && styles.resendTextDisabled]}>
          {timer > 0
            ? `Hantar semula dalam ${timer}s`
            : isResending ? 'Menghantar...' : 'Hantar semula OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Keep your existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
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
    fontSize: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
    letterSpacing: 10,
  },
  button: {
    backgroundColor: '#00D09E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a9a9a9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#00D09E',
    fontSize: 14,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#a9a9a9',
  },
});
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/auth-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';

export default function OTPScreen() {
  const router = useRouter();
  const { confirmation } = useAuth();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP.');
      return;
    }
    if (!confirmation) {
      Alert.alert('Error', 'Could not verify OTP. Please try signing up again.');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      const userCredential = await confirmation.confirm(otp);
      const user = userCredential.user;

      // If this is sign up, save user data to Firestore
      if (params.isSignUp === 'true' && user) {
        await firestore().collection('users').doc(user.uid).set({
          name: params.name,
          phoneNumber: params.phoneNumber,
          idNumber: params.idNumber,
          passcode: params.passcode, // Note: In production, you should hash this!
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Phone number verified successfully!', [
        { text: 'OK', onPress: () => router.replace('/successfulSignUp') }
      ]);
    } catch (error) {
      console.error('Error confirming OTP:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to your phone.</Text>
      <TextInput
        style={styles.input}
        placeholder="6-digit OTP"
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
          {loading ? 'Verifying...' : 'Submit OTP'}
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
});
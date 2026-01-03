import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { useAuth } from '@/context/auth-context';

export default function SplashScreen() {
  const router = useRouter();
  const { isPinVerified } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      // Wait for splash animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentUser = auth().currentUser;

      if (currentUser) {
        // User is logged in
        if (isPinVerified) {
          // PIN already verified (unlikely on fresh app open)
          router.replace('/(tabs)/home');
        } else {
          // Need PIN verification
          router.replace('/pinLock');
        }
      } else {
        // User is not logged in
        router.replace('/login');
      }

      setIsChecking(false);
    };

    checkAuthStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
      />
      {isChecking && (
        <ActivityIndicator
          size="large"
          color="#48BB78"
          style={styles.loader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  loader: {
    marginTop: 24,
  },
});

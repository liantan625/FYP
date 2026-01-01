import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRecaptcha } from '../context/recaptcha-context';
import { RecaptchaAction } from '@google-cloud/recaptcha-enterprise-react-native';
import { useTranslation } from 'react-i18next';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/settings-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const router = useRouter();
  const { client, isReady } = useRecaptcha();
  const { t, i18n } = useTranslation();
  const fontSize = useScaledFontSize();
  const { fontScaleKey, setFontScale } = useSettings();
  const [phoneNumber, setPhoneNumber] = useState('+60');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const instructions = ['Change Language', 'Tukar Bahasa', '更換語言', 'மொழி மாற்றம்'];
  const [instructionIndex, setInstructionIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '157329778221-vmp8sr7sgajonvq8dcpd7tsr3ao6s2g3.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });

    const loopAnimation = () => {
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setInstructionIndex((prev) => (prev + 1) % instructions.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(loopAnimation);
      });
    };

    loopAnimation();
  }, []);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('user-language', lang);
    setShowLanguageModal(false);
  };

  const toggleFontSizeMenu = () => {
    setShowFontSizeMenu(!showFontSizeMenu);
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontScale(size);
    setShowFontSizeMenu(false);
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ms', label: 'Bahasa Melayu' },
    { code: 'zh', label: '中文' },
    { code: 'ta', label: 'தமிழ்' },
  ];

  const onGoogleButtonPress = async () => {
    try {
      setLoading(true);
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;

      // Check if user exists in Firestore and has completed profile
      const userDoc = await firestore().collection('users').doc(user.uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.name && userData?.idNumber && userData?.birthday) {
          router.replace('/(tabs)/home');
        } else {
          // User exists but profile incomplete
          router.replace('/completeProfile');
        }
      } else {
        // New user, go to complete profile
        router.replace('/completeProfile');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      Alert.alert(t('common.error'), `Google Sign-In failed: ${error.code}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    console.log('Starting handleSendCode...');
    if (!phoneNumber) {
      Alert.alert(t('common.error'), t('login.enterPhoneNumber'));
      return;
    }

    setLoading(true);
    try {
      if (__DEV__) {
        console.log('Dev mode: Skipping reCAPTCHA, verification is disabled');
      } else if (isReady && client) {
        console.log('Executing reCAPTCHA for LOGIN...');
        try {
          const token = await client.execute(RecaptchaAction.LOGIN());
          console.log('reCAPTCHA Token received:', token);
        } catch (recaptchaError) {
          console.error('reCAPTCHA Execution Error:', recaptchaError);
          // Don't block flow, let Firebase try anyway
        }
      } else {
        console.log('reCAPTCHA client not ready or not initialized');
      }

      console.log('Calling auth().signInWithPhoneNumber...');
      const confirmationResult = await auth().signInWithPhoneNumber(phoneNumber);
      console.log('signInWithPhoneNumber returned result:', confirmationResult);

      setConfirmation(confirmationResult);
      setCountdown(30); // Start 30s cooldown
      Alert.alert(t('common.success'), t('login.codeSent'));
    } catch (error: any) {
      console.error('OTP Send Error Details:', error);
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      Alert.alert(t('common.error'), t('login.codeSendFailed'));
    } finally {
      console.log('handleSendCode finally block reached');
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!passcode) {
      Alert.alert(t('common.error'), t('login.enterVerificationCode'));
      return;
    }

    setLoading(true);
    try {
      const credential = await confirmation.confirm(passcode);
      const user = credential.user;

      // Check if user exists in Firestore and has completed profile
      const userDoc = await firestore().collection('users').doc(user.uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.name && userData?.idNumber && userData?.birthday) {
          router.replace('/(tabs)/home');
        } else {
          // User exists but profile incomplete
          router.replace('/completeProfile');
        }
      } else {
        // New user, go to complete profile
        router.replace('/completeProfile');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert(t('common.error'), t('login.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowLanguageModal(true)} style={styles.languageButtonContainer}>
          <MaterialIcons name="language" size={24} color="#00D9A8" />
          <Animated.Text style={[styles.languageButtonText, { opacity: fadeAnim }]}>
            {instructions[instructionIndex]}
          </Animated.Text>
        </TouchableOpacity>
        <View style={styles.fontSizeContainer}>
          <TouchableOpacity onPress={toggleFontSizeMenu} style={styles.fontSizeButton}>
            <MaterialIcons name="format-size" size={24} color="#333" />
          </TouchableOpacity>
          {showFontSizeMenu && (
            <View style={styles.fontSizeMenu}>
              <TouchableOpacity
                style={[styles.fontSizeOption, fontScaleKey === 'small' && styles.activeFontSize]}
                onPress={() => handleFontSizeChange('small')}
              >
                <Text style={{ fontSize: fontSize.small }}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fontSizeOption, fontScaleKey === 'medium' && styles.activeFontSize]}
                onPress={() => handleFontSizeChange('medium')}
              >
                <Text style={{ fontSize: fontSize.medium }}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fontSizeOption, fontScaleKey === 'large' && styles.activeFontSize]}
                onPress={() => handleFontSizeChange('large')}
              >
                <Text style={{ fontSize: fontSize.large }}>A</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { fontSize: fontSize.heading }]}>DuitU</Text>
          <Text style={[styles.tagline, { fontSize: fontSize.body }]}>{t('login.tagline')}</Text>
        </View>

        <TextInput
          style={[styles.input, { fontSize: fontSize.body }]}
          placeholder={t('login.phoneNumberPlaceholder')}
          value={phoneNumber}
          onChangeText={(text) => {
            if (text.startsWith('+60')) {
              setPhoneNumber(text);
            } else {
              setPhoneNumber('+60' + text.replace(/[^0-9]/g, ''));
            }
          }}
          keyboardType="phone-pad"
        />

        {!confirmation && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { fontSize: fontSize.medium }]}>
              {loading ? t('login.sendingCode') : t('login.sendCode')}
            </Text>
          </TouchableOpacity>
        )}

        {confirmation && (
          <>
            <TextInput
              style={[styles.input, { fontSize: fontSize.body }]}
              placeholder={t('login.otpPlaceholder')}
              value={passcode}
              onChangeText={setPasscode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { fontSize: fontSize.medium }]}>
                {loading ? t('login.verifying') : t('login.verifyCode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resendButton, countdown > 0 && styles.disabledButton]}
              onPress={handleSendCode}
              disabled={loading || countdown > 0}
            >
              <Text style={[styles.buttonText, { fontSize: fontSize.medium }]}>
                {countdown > 0 ? `Resend Code (${countdown}s)` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={onGoogleButtonPress}
          disabled={loading}
        >
          <Image
            source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
          // Using a simple Material Icon for now as a reliable asset, or you can add a google logo asset
          />
          <Ionicons name="logo-google" size={24} color="#DB4437" style={{ marginRight: 10 }} />
          {/* Note: g-translate is just a placeholder icon, usually you'd use a real Google logo image asset */}
          <Text style={[styles.googleButtonText, { fontSize: fontSize.medium }]}>
            Sign in with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/signup')}
          style={styles.linkButton}
        >
          <Text style={[styles.linkText, { fontSize: fontSize.small }]}>
            {t('login.noAccount')}{' '}
            <Text style={[styles.linkTextBold, { fontSize: fontSize.small }]}>{t('login.signupLink')}</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontSize: fontSize.large }]}>{t('profile.language')}</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  i18n.language === lang.code && styles.selectedLanguage
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[
                  styles.languageText,
                  { fontSize: fontSize.medium },
                  i18n.language === lang.code && styles.selectedLanguageText
                ]}>
                  {lang.label}
                </Text>
                {i18n.language === lang.code && (
                  <MaterialIcons name="check" size={24} color="#00D9A8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  languageButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#00D9A8',
  },
  languageButtonText: {
    marginLeft: 8,
    color: '#00D9A8',
    fontWeight: '600',
    fontSize: 14,
  },
  languageButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0FDF9',
  },
  instructionText: {
    marginLeft: 12,
    color: '#00D9A8',
    fontWeight: '500',
  },
  fontSizeContainer: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  fontSizeReminder: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  fontSizeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  fontSizeMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
  fontSizeOption: {
    padding: 10,
    marginHorizontal: 2,
    borderRadius: 5,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFontSize: {
    backgroundColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontWeight: 'bold',
    color: '#333',
  },
  tagline: {
    color: '#666',
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
  resendButton: {
    backgroundColor: '#333', // Darker color to distinguish from verify button
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  googleButtonText: {
    color: '#333',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguage: {
    backgroundColor: '#F0FDF9',
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  languageText: {
    color: '#333',
  },
  selectedLanguageText: {
    color: '#00D9A8',
    fontWeight: 'bold',
  },
});

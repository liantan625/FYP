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
  ScrollView,
  Animated,
  Modal,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../context/auth-context';
import { useRecaptcha } from '../context/recaptcha-context';
import { RecaptchaAction } from '@google-cloud/recaptcha-enterprise-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useSettings } from '../context/settings-context';

export default function SignUpScreen() {
  const { t, i18n } = useTranslation();
  const fontSize = useScaledFontSize();
  const router = useRouter();
  const { setConfirmation } = useAuth();
  const { client, isReady } = useRecaptcha();
  const { fontScaleKey, setFontScale } = useSettings();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+60');
  const [idNumber, setIdNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [repeatPasscode, setRepeatPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);

  const instructions = ['Change Language', 'Tukar Bahasa', '更換語言', 'மொழி மாற்றம்'];
  const [instructionIndex, setInstructionIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fontSizeInstructions = ['Adjust Font Size', 'Laraskan Saiz Fon', '調整字體大小', 'எழுத்துரு அளவை சரிசெய்யவும்'];
  const [fontSizeInstructionIndex, setFontSizeInstructionIndex] = useState(0);
  const fontSizeFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

  useEffect(() => {
    const loopFontSizeAnimation = () => {
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(fontSizeFadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFontSizeInstructionIndex((prev) => (prev + 1) % fontSizeInstructions.length);
        Animated.timing(fontSizeFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(loopFontSizeAnimation);
      });
    };

    loopFontSizeAnimation();
  }, []);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
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
      Alert.alert(t('common.error'), t('signup.fillAllFields'));
      return;
    }
    
    const birthdayString = birthday.toLocaleDateString('en-GB');
    if (passcode !== repeatPasscode) {
      Alert.alert(t('common.error'), t('signup.passcodeMismatch'));
      return;
    }
    if (passcode.length !== 6) {
      Alert.alert(t('common.error'), t('signup.passcodeLength'));
      return;
    }
    if (idNumber.length !== 12 && !/^[A-Z]/.test(idNumber)) {
      Alert.alert(t('common.error'), t('signup.invalidId'));
      return;
    }

    if (!isReady || !client) {
      Alert.alert(t('common.error'), t('signup.recaptchaNotReady'));
      return;
    }
  
    setLoading(true);
    try {
      // Execute reCAPTCHA for SIGNUP action
      console.log('Executing reCAPTCHA for SIGNUP...');
      const token = await client.execute(RecaptchaAction.SIGNUP());
      console.log('reCAPTCHA Token received:', token);

      // TODO: Send token to your backend for verification before proceeding
      // For now, we proceed with phone authentication
      
      // Clean the phone number: remove non-digits and leading 0
      const cleanedPhone = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
      const fullPhoneNumber = `+60${cleanedPhone}`;
      
      console.log(`Attempting sign in with: ${fullPhoneNumber}`);

      const confirm = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmation(confirm);
      router.push({
        pathname: '/(tabs)/OTP',
        params: { name, phoneNumber: fullPhoneNumber, idNumber, birthday: birthdayString, passcode, isSignUp: 'true' },
      });
    } catch (error) {
      console.error('Error during signup:', error);
      Alert.alert(t('common.error'), t('signup.otpFailed'));
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

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { fontSize: fontSize.heading }]}>{t('signup.title')}</Text>
          <Text style={[styles.subtitle, { fontSize: fontSize.body }]}>{t('signup.subtitle')}</Text>

          <TextInput
            style={[styles.input, { fontSize: fontSize.body }]}
            placeholder={t('signup.fullName')}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.phoneInputContainer}>
            <TextInput
              style={[styles.phoneInput, { fontSize: fontSize.body }]}
              placeholder={t('signup.phoneNumber')}
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
          </View>

          <TextInput
            style={[styles.input, { fontSize: fontSize.body }]}
            placeholder={t('signup.idNumber')}
            value={idNumber}
            onChangeText={setIdNumber}
            autoCapitalize="characters"
          />

          <TouchableOpacity onPress={showDatePicker} style={styles.dateInputContainer}>
            <Text style={[styles.dateInput, !birthday && styles.dateInputPlaceholder, { fontSize: fontSize.body }]}>
              {birthday ? birthday.toLocaleDateString('en-GB') : t('signup.birthDate')}
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
            style={[styles.input, { fontSize: fontSize.body }]}
            placeholder={t('signup.passcode')}
            value={passcode}
            onChangeText={setPasscode}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />

          <TextInput
            style={[styles.input, { fontSize: fontSize.body }]}
            placeholder={t('signup.repeatPasscode')}
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
            <Text style={[styles.buttonText, { fontSize: fontSize.medium }]}>
              {loading ? t('signup.creatingAccount') : t('signup.register')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.linkButton}
          >
            <Text style={[styles.linkText, { fontSize: fontSize.small }]}>
              {t('signup.alreadyHaveAccount')} <Text style={[styles.linkTextBold, { fontSize: fontSize.small }]}>{t('signup.login')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  fontSizeReminder: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
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
  backButton: {
    position: 'absolute',
    top: 100,
    left: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  headerContainer: {
  },
  fontSizeContainer: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  fontSizeButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#00D9A8',
  },
  fontSizeButtonText: {
    marginLeft: 8,
    color: '#00D9A8',
    fontWeight: '600',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  languageText: {
    fontSize: 16,
  },
  selectedLanguage: {
    backgroundColor: '#f0f0f0',
  },
  selectedLanguageText: {
    color: '#00D9A8',
  },
});

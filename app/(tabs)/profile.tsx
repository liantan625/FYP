import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNPickerSelect from 'react-native-picker-select';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useSettings } from '@/context/settings-context';
import { FontScaleOptions } from '@/constants/theme';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

interface UserData {
  name: string;
  idNumber: string;
  profilePicture?: string;
  email?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { fontScale, fontScaleKey, setFontScale, language, setLanguage } = useSettings();
  const [isLanguagePickerVisible, setLanguagePickerVisible] = useState(false);

  const languages = [
    { label: 'Bahasa Melayu', value: 'ms' },
    { label: 'English', value: 'en' },
    { label: '中文', value: 'zh' },
    { label: 'தமிழ்', value: 'ta' },
  ];

  const getSelectedLanguageLabel = () => {
    const selected = languages.find(l => l.value === language);
    return selected ? selected.label : 'Select Language';
  };

  const handleFontSizeChange = async (key: 'small' | 'medium' | 'large') => {
    await setFontScale(key);
  };

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists()) {
            setUser(documentSnapshot.data() as UserData);
          } else {
            setError(t('profile.userDataNotFound'));
          }
          setLoading(false);
        }, error => {
          setError(error.message);
          setLoading(false);
        });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        {
          text: t('profile.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.ok'),
          onPress: () => {
            auth().signOut().then(() => {
              router.replace('/login');
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color="#2196F3" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={{ fontSize: fontSize.large, color: '#EF4444' }}>{t('profile.error', { message: error })}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('profile.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <Text style={[styles.userName, { fontSize: fontSize.title }]}>{user?.name}</Text>
          <Text style={[styles.userId, { fontSize: fontSize.medium }]}>{user?.idNumber}</Text>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/EditProfile')}>
            <View style={styles.menuButtonContent}>
              <View style={styles.menuButtonLeft}>
                <MaterialIcons name="edit" size={24 * fontScale} color="#2196F3" />
                <Text style={[styles.menuButtonText, { fontSize: fontSize.large }]} numberOfLines={2}>{t('profile.editProfile')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24 * fontScale} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/Security')}>
            <View style={styles.menuButtonContent}>
              <View style={styles.menuButtonLeft}>
                <MaterialIcons name="lock" size={24 * fontScale} color="#2196F3" />
                <Text style={[styles.menuButtonText, { fontSize: fontSize.large }]} numberOfLines={2}>{t('profile.security')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24 * fontScale} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/about')}>
            <View style={styles.menuButtonContent}>
              <View style={styles.menuButtonLeft}>
                <MaterialIcons name="info-outline" size={24 * fontScale} color="#2196F3" />
                <Text style={[styles.menuButtonText, { fontSize: fontSize.large }]} numberOfLines={2}>{t('profile.about')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24 * fontScale} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuButton, styles.logoutButton]} onPress={handleLogout}>
            <View style={styles.menuButtonContent}>
              <View style={styles.menuButtonLeft}>
                <MaterialIcons name="logout" size={24 * fontScale} color="#EF4444" />
                <Text style={[styles.menuButtonText, styles.logoutText, { fontSize: fontSize.large }]} numberOfLines={2}>{t('profile.logout')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24 * fontScale} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Language Selector */}
        <View style={styles.languageSection}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('profile.language')}</Text>
          <View style={styles.languageButton}>
            <MaterialIcons name="language" size={24 * fontScale} color="#2196F3" style={styles.languageIcon} />
            {Platform.OS === 'ios' ? (
              <>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => setLanguagePickerVisible(true)}
                >
                  <Text style={[pickerSelectStyles(fontScale).inputIOS, { paddingVertical: 12 }]}>
                    {getSelectedLanguageLabel()}
                  </Text>
                </TouchableOpacity>
                <Modal
                  visible={isLanguagePickerVisible}
                  transparent={true}
                  animationType="slide"
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setLanguagePickerVisible(false)}>
                          <Text style={styles.doneButtonText}>Selesai</Text>
                        </TouchableOpacity>
                      </View>
                      <Picker
                        selectedValue={language}
                        onValueChange={(itemValue) => setLanguage(itemValue)}
                      >
                        {languages.map((item) => (
                          <Picker.Item key={item.value} label={item.label} value={item.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </Modal>
              </>
            ) : (
              <RNPickerSelect
                onValueChange={(value) => setLanguage(value)}
                items={languages}
                style={pickerSelectStyles(fontScale)}
                value={language}
                placeholder={{}}
              />
            )}
          </View>
        </View>

        {/* Font Size Selector */}
        <View style={styles.fontSizeSection}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.large }]}>{t('profile.fontSize')}</Text>
          <Text style={[styles.sectionDescription, { fontSize: fontSize.body }]}>
            {t('profile.fontSizeDescription')}
          </Text>

          {Object.entries(FontScaleOptions).map(([key, { label, value }]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.fontOption,
                fontScaleKey === key && styles.fontOptionSelected
              ]}
              onPress={() => handleFontSizeChange(key as 'small' | 'medium' | 'large')}
            >
              <View style={styles.fontOptionLeft}>
                <View style={[
                  styles.radio,
                  fontScaleKey === key && styles.radioSelected
                ]}>
                  {fontScaleKey === key && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.fontOptionLabel, { fontSize: fontSize.medium }]}>
                  {t(`profile.fontSizeOptions.${key}`)}
                </Text>
              </View>
              <Text style={[styles.previewText, { fontSize: 16 * value }]}>
                {t('profile.sampleText')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  profilePictureContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    borderRadius: 70,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  userName: {
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  userId: {
    color: '#666',
    marginTop: 6,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  menuButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuButtonText: {
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  logoutText: {
    color: '#EF4444',
  },
  languageSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  languageIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  sectionDescription: {
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 22,
  },
  fontSizeSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fontOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fontOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  fontOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#999',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2196F3',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2196F3',
  },
  fontOptionLabel: {
    fontWeight: '600',
    color: '#333',
  },
  previewText: {
    color: '#666',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  doneButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const pickerSelectStyles = (fontScale: number) => StyleSheet.create({
  inputIOS: {
    fontSize: 16 * fontScale,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  inputAndroid: {
    fontSize: 16 * fontScale,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  viewContainer: {
    flex: 1,
  },
});
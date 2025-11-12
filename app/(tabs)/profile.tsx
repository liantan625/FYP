import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNPickerSelect from 'react-native-picker-select';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useSettings } from '@/context/settings-context';
import { FontScaleOptions } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('ms');
  const { fontScale, fontScaleKey, setFontScale } = useSettings();

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
          if (documentSnapshot.exists) {
            setUser(documentSnapshot.data());
          } else {
            setError('User data not found.');
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
      'Log Keluar',
      'Anda pasti mahu log keluar?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'OK',
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
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Ralat: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <Image source={{ uri: user?.profilePicture || 'https://picsum.photos/200' }} style={styles.profilePicture} />
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userId}>{user?.idNumber}</Text>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/EditProfile')}>
            <Text>Sunting Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/Security')}>
            <Text>Keselamatan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/Settings')}>
            <Text>Tetapan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
            <Text>Log Keluar</Text>
          </TouchableOpacity>
        </View>

        {/* Language Selector */}
        <View style={styles.menuButton}>
          <RNPickerSelect
            onValueChange={(value) => setSelectedLanguage(value)}
            items={[
              { label: 'Bahasa Melayu', value: 'ms' },
              { label: '中文', value: 'zh' },
              { label: 'English', value: 'en' },
              { label: 'Tamil', value: 'ta' },
            ]}
            style={pickerSelectStyles}
            value={selectedLanguage}
            placeholder={{}}
          />
        </View>

        {/* Font Size Selector */}
        <View style={styles.fontSizeSection}>
          <Text style={[styles.sectionTitle, { fontSize: 18 * fontScale }]}>Saiz Tulisan</Text>
          <Text style={[styles.sectionDescription, { fontSize: 14 * fontScale }]}>
            Pilih saiz tulisan yang sesuai untuk penglihatan anda
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
                <Text style={[styles.fontOptionLabel, { fontSize: 16 * fontScale }]}>
                  {label}
                </Text>
              </View>
              <Text style={[styles.previewText, { fontSize: 16 * value }]}>
                Contoh Teks
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
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  userId: {
    fontSize: 16,
    color: 'gray',
    marginTop: 5,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  fontSizeSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#666',
    marginBottom: 20,
  },
  fontOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  fontOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  fontOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2196F3',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  fontOptionLabel: {
    fontWeight: '500',
  },
  previewText: {
    color: '#666',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});
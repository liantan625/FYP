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

// Mock user data - replace with Firebase data
const mockUser = {
  name: 'John Doe',
  idNumber: '123456-78-9012',
  profilePicture: 'https://picsum.photos/200',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    // Simulate fetching data from Firebase
    const fetchUserData = async () => {
      try {
        // Replace with your actual Firebase fetching logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        setUser(mockUser);
      } catch (e) {
        setError(e.message);
        Alert.alert('Error', 'Failed to fetch user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            // Replace with your actual Firebase sign-out logic
            console.log('Logging out...');
            router.replace('/login');
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
        <Text>Error: {error}</Text>
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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userId}>{user.idNumber}</Text>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/EditProfile')}>
            <Text>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/Security')}>
            <Text>Security</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/Settings')}>
            <Text>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
            <Text>Logout</Text>
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
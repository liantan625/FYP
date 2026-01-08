import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(documentSnapshot => {
          if (documentSnapshot.exists) {
            const data = documentSnapshot.data();
            setName(data?.name || '');
            setBirthday(data?.birthday || '');
          }
          setLoading(false);
        });

      return () => unsubscribe();
    }
  }, []);

  const handleSave = async () => {
    const user = auth().currentUser;
    if (user) {
      try {
        await firestore().collection('users').doc(user.uid).update({
          name: name,
          birthday: birthday,
        });
        Alert.alert(t('editProfile.success'), t('editProfile.profileUpdated'), [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (error) {
        console.error('Error updating profile: ', error);
        Alert.alert(t('editProfile.error'), t('editProfile.updateFailed'));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('editProfile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View>
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('editProfile.fullName')}</Text>
          <TextInput
            style={[styles.input, { fontSize: fontSize.medium }]}
            placeholder={t('editProfile.fullName')}
            value={name}
            onChangeText={setName}
          />
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('editProfile.birthday')}</Text>
          <TextInput
            style={[styles.input, { fontSize: fontSize.medium }]}
            placeholder={t('editProfile.birthdayPlaceholder')}
            value={birthday}
            onChangeText={setBirthday}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { fontSize: fontSize.medium }]}>{t('editProfile.save')}</Text>
        </TouchableOpacity>
      </View>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#00D9A8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

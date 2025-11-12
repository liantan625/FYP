
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettings } from '../context/settings-context';
import { FontScaleOptions } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { fontScale, fontScaleKey, setFontScale } = useSettings();

  const handleFontSizeChange = async (key: 'small' | 'medium' | 'large') => {
    await setFontScale(key);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: 18 * fontScale }]}>Tetapan</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: 18 * fontScale }]}>Saiz Tulisan</Text>
          <Text style={[styles.sectionDescription, { fontSize: 14 * fontScale }]}>
            Pilih saiz tulisan yang sesuai untuk penglihatan anda
          </Text>
          
          {Object.entries(FontScaleOptions).map(([key, { label, value }]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.option,
                fontScaleKey === key && styles.optionSelected
              ]}
              onPress={() => handleFontSizeChange(key as 'small' | 'medium' | 'large')}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.radio,
                  fontScaleKey === key && styles.radioSelected
                ]}>
                  {fontScaleKey === key && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionLabel, { fontSize: 16 * fontScale }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
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
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  optionLeft: {
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
  optionLabel: {
    fontWeight: '500',
  },
  previewText: {
    color: '#666',
  },
});

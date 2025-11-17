import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Available emoji icons for asset categories
const availableIcons = [
  '🏦', '💰', '🏠', '💵', '📈', '💎', '🏪', '🏢', 
  '🚗', '🚢', '✈️', '🎨', '⚡', '🌾', '🐄', '🐟',
  '⛏️', '🔧', '💼', '📊', '🏭', '🔑', '💳', '❓'
];

// Available colors for asset categories
const availableColors = [
  { name: 'Hijau', value: '#48BB78' },
  { name: 'Biru', value: '#4A9EFF' },
  { name: 'Biru Muda', value: '#6B9EFF' },
  { name: 'Biru Cerah', value: '#8BB4FF' },
  { name: 'Emas', value: '#FFD700' },
  { name: 'Oren', value: '#FFA94D' },
  { name: 'Ungu', value: '#9775FA' },
  { name: 'Merah Jambu', value: '#FF6B9D' },
];

export default function AddAssetCategoryScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏦');
  const [selectedColor, setSelectedColor] = useState('#48BB78');

  const handleSave = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Ralat', 'Sila masukkan nama kategori aset.');
      return;
    }

    try {
      // Load existing custom asset categories
      const existingCategories = await AsyncStorage.getItem('customAssetCategories');
      const categories = existingCategories ? JSON.parse(existingCategories) : [];

      // Create new category object
      const newCategory = {
        id: Date.now().toString(),
        label: categoryName,
        value: categoryName.toLowerCase().replace(/\s+/g, '_'),
        icon: selectedIcon,
        color: selectedColor,
        isCustom: true,
      };

      // Add to array
      categories.push(newCategory);

      // Save back to AsyncStorage
      await AsyncStorage.setItem('customAssetCategories', JSON.stringify(categories));

      Alert.alert(
        'Berjaya!',
        `Kategori aset "${categoryName}" telah ditambah!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving asset category:', error);
      Alert.alert('Ralat', 'Gagal menyimpan kategori aset. Sila cuba lagi.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>Tambah Kategori Aset</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.form}>
          {/* Category Name */}
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>📝 Nama Kategori Aset</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              placeholder="Contoh: Emas, Tanah, Perniagaan"
              value={categoryName}
              onChangeText={setCategoryName}
            />
          </View>

          {/* Icon Selection */}
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>🎨 Pilih Ikon</Text>
          <View style={styles.iconGrid}>
            {availableIcons.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  selectedIcon === icon && styles.iconButtonSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={[styles.iconText, { fontSize: fontSize.heading }]}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Selection */}
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>🎨 Pilih Warna</Text>
          <View style={styles.colorGrid}>
            {availableColors.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorButton,
                  { backgroundColor: color.value },
                  selectedColor === color.value && styles.colorButtonSelected,
                ]}
                onPress={() => setSelectedColor(color.value)}
              >
                {selectedColor === color.value && (
                  <MaterialIcons name="check" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <Text style={[styles.label, { fontSize: fontSize.medium }]}>👁️ Pratonton</Text>
          <View style={[styles.previewCard, { backgroundColor: selectedColor }]}>
            <Text style={[styles.previewIcon, { fontSize: fontSize.heading }]}>{selectedIcon}</Text>
            <Text style={[styles.previewText, { fontSize: fontSize.medium }]}>
              {categoryName || 'Nama Kategori Aset'}
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={[styles.saveButtonText, { fontSize: fontSize.medium }]}>Simpan Kategori Aset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#48BB78',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 15,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    borderColor: '#48BB78',
    backgroundColor: '#E6F9F5',
  },
  iconText: {
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  colorButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#2D3748',
  },
  previewCard: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewIcon: {
    marginBottom: 10,
  },
  previewText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#48BB78',
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

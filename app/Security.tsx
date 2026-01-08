import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export default function SecurityScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>
          {t('security.title')}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Change PIN */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/changePIN')}
        >
          <View style={styles.menuCardContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <MaterialIcons name="lock-outline" size={24} color="#2196F3" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { fontSize: fontSize.large }]}>
                {t('security.changePin')}
              </Text>
              <Text style={[styles.menuDescription, { fontSize: fontSize.small }]}>
                {t('security.changePinDescription')}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Reset PIN via OTP */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/resetPIN')}
        >
          <View style={styles.menuCardContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFEDD5' }]}>
              <MaterialIcons name="phonelink-lock" size={24} color="#F97316" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { fontSize: fontSize.large }]}>
                {t('security.resetPin')}
              </Text>
              <Text style={[styles.menuDescription, { fontSize: fontSize.small }]}>
                {t('security.resetPinDescription')}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoContent}>
            <MaterialIcons name="info-outline" size={24} color="#2196F3" />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { fontSize: fontSize.medium }]}>
                {t('security.infoTitle')}
              </Text>
              <Text style={[styles.infoMessage, { fontSize: fontSize.small }]}>
                {t('security.infoMessage')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '600',
    color: '#1F2937',
  },
  menuDescription: {
    color: '#6B7280',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  infoMessage: {
    color: '#1D4ED8',
    marginTop: 8,
    lineHeight: 20,
  },
});

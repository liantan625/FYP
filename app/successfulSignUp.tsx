import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export default function SuccessfulSignUp() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="check-circle" size={100} color="#00D9A8" />
        </View>

        {/* Success Message */}
        <Text style={[styles.title, { fontSize: fontSize.xlarge }]}>{t('successfulSignUp.title')}</Text>
        <Text style={[styles.subtitle, { fontSize: fontSize.large }]}>{t('successfulSignUp.subtitle')}</Text>
        <Text style={[styles.description, { fontSize: fontSize.medium }]}>
          {t('successfulSignUp.description')}
        </Text>

        {/* Sign In Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.buttonText, { fontSize: fontSize.large }]}>{t('successfulSignUp.login')}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Decorative Bottom */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { fontSize: fontSize.small }]}>{t('successfulSignUp.welcome')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E6FFF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#00D9A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '600',
    color: '#00D9A8',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D9A8',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#00D9A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
  },
});

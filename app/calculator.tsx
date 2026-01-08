import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export default function CalculatorScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [currentAge, setCurrentAge] = useState('');
  const [retirementAge, setRetirementAge] = useState('55');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('5');
  const [result, setResult] = useState<number | null>(null);

  const calculateRetirement = () => {
    const age = parseInt(currentAge) || 0;
    const retireAge = parseInt(retirementAge) || 55;
    const savings = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const returnRate = parseFloat(expectedReturn) / 100 || 0.05;

    const yearsToRetirement = retireAge - age;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyReturn = returnRate / 12;

    // Future value calculation
    const futureValueSavings = savings * Math.pow(1 + returnRate, yearsToRetirement);
    const futureValueContributions = monthly * ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);

    const totalRetirementFund = futureValueSavings + futureValueContributions;
    setResult(totalRetirementFund);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('calculator.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.currentAge')}</Text>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              value={currentAge}
              onChangeText={setCurrentAge}
              keyboardType="numeric"
              placeholder={t('calculator.placeholder.age')}
            />

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.retirementAge')}</Text>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              value={retirementAge}
              onChangeText={setRetirementAge}
              keyboardType="numeric"
              placeholder={t('calculator.placeholder.retireAge')}
            />

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.currentSavings')}</Text>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              value={currentSavings}
              onChangeText={setCurrentSavings}
              keyboardType="numeric"
              placeholder={t('calculator.placeholder.savings')}
            />

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.monthlyContribution')}</Text>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              value={monthlyContribution}
              onChangeText={setMonthlyContribution}
              keyboardType="numeric"
              placeholder={t('calculator.placeholder.monthly')}
            />

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.expectedReturn')}</Text>
            <TextInput
              style={[styles.input, { fontSize: fontSize.medium }]}
              value={expectedReturn}
              onChangeText={setExpectedReturn}
              keyboardType="numeric"
              placeholder={t('calculator.placeholder.return')}
            />

            <TouchableOpacity style={styles.calculateButton} onPress={calculateRetirement}>
              <Text style={[styles.calculateButtonText, { fontSize: fontSize.medium }]}>{t('calculator.calculate')}</Text>
            </TouchableOpacity>

            {result !== null && (
              <View style={styles.resultContainer}>
                <Text style={[styles.resultLabel, { fontSize: fontSize.medium }]}>{t('calculator.result')}</Text>
                <Text style={[styles.resultAmount, { fontSize: fontSize.xlarge }]}>
                  RM {result.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  calculateButton: {
    backgroundColor: '#006400',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
  },
  calculateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    alignItems: 'center',
  },
  resultLabel: {
    color: '#059669',
    fontWeight: '600',
  },
  resultAmount: {
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 8,
  },
});

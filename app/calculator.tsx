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
  Alert,
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validate money input - reject more than 2 decimal places and negatives
  const validateMoneyInput = (value: string, fieldName: string): string | null => {
    if (value === '') return null;

    const num = parseFloat(value);
    if (isNaN(num)) return t('calculator.validation.invalidNumber');
    if (num < 0) return t('calculator.validation.noNegatives');

    // Check for more than 2 decimal places
    const decimalParts = value.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      return t('calculator.validation.maxTwoDecimals');
    }

    return null;
  };

  // Validate age input - must be positive integer
  const validateAgeInput = (value: string): string | null => {
    if (value === '') return null;

    const num = parseInt(value);
    if (isNaN(num)) return t('calculator.validation.invalidNumber');
    if (num < 0) return t('calculator.validation.noNegatives');
    if (num > 120) return t('calculator.validation.invalidAge');

    return null;
  };

  // Handle money input with validation
  const handleMoneyInput = (value: string, setter: (val: string) => void, fieldKey: string) => {
    // Allow empty or valid money format
    if (value === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      setter(value);
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    } else {
      // Show error for invalid format
      setErrors(prev => ({ ...prev, [fieldKey]: t('calculator.validation.maxTwoDecimals') }));
    }
  };

  // Handle age input with validation
  const handleAgeInput = (value: string, setter: (val: string) => void, fieldKey: string) => {
    // Allow empty or positive integers only
    if (value === '' || /^[0-9]+$/.test(value)) {
      setter(value);
      const error = validateAgeInput(value);
      setErrors(prev => ({ ...prev, [fieldKey]: error || '' }));
    }
  };

  const calculateRetirement = () => {
    // Validate all fields before calculation
    const validationErrors: { [key: string]: string } = {};

    const age = parseInt(currentAge) || 0;
    const retireAge = parseInt(retirementAge) || 55;

    // Validate current age
    if (!currentAge) {
      validationErrors.currentAge = t('calculator.validation.required');
    } else if (age < 0) {
      validationErrors.currentAge = t('calculator.validation.noNegatives');
    }

    // Validate retirement age - must be greater than current age
    if (retireAge <= age) {
      validationErrors.retirementAge = t('calculator.validation.retirementMustBeGreater');
    }

    // Validate money fields
    const savingsError = validateMoneyInput(currentSavings, 'currentSavings');
    if (savingsError) validationErrors.currentSavings = savingsError;

    const monthlyError = validateMoneyInput(monthlyContribution, 'monthlyContribution');
    if (monthlyError) validationErrors.monthlyContribution = monthlyError;

    const returnError = validateMoneyInput(expectedReturn, 'expectedReturn');
    if (returnError) validationErrors.expectedReturn = returnError;

    // If there are errors, show them and don't calculate
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setResult(null);
      return;
    }

    // Clear errors and proceed with calculation
    setErrors({});

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
              style={[styles.input, errors.currentAge ? styles.inputError : null, { fontSize: fontSize.medium }]}
              value={currentAge}
              onChangeText={(val) => handleAgeInput(val, setCurrentAge, 'currentAge')}
              keyboardType="numeric"
              placeholder={t('calculator.placeholder.age')}
            />
            {errors.currentAge ? <Text style={styles.errorText}>{errors.currentAge}</Text> : null}

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.retirementAge')}</Text>
            <TextInput
              style={[styles.input, errors.retirementAge ? styles.inputError : null, { fontSize: fontSize.medium }]}
              value={retirementAge}
              onChangeText={(val) => handleAgeInput(val, setRetirementAge, 'retirementAge')}
              keyboardType="numeric"
              placeholder={t('calculator.placeholder.retireAge')}
            />
            {errors.retirementAge ? <Text style={styles.errorText}>{errors.retirementAge}</Text> : null}

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.currentSavings')}</Text>
            <TextInput
              style={[styles.input, errors.currentSavings ? styles.inputError : null, { fontSize: fontSize.medium }]}
              value={currentSavings}
              onChangeText={(val) => handleMoneyInput(val, setCurrentSavings, 'currentSavings')}
              keyboardType="decimal-pad"
              placeholder={t('calculator.placeholder.savings')}
            />
            {errors.currentSavings ? <Text style={styles.errorText}>{errors.currentSavings}</Text> : null}

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.monthlyContribution')}</Text>
            <TextInput
              style={[styles.input, errors.monthlyContribution ? styles.inputError : null, { fontSize: fontSize.medium }]}
              value={monthlyContribution}
              onChangeText={(val) => handleMoneyInput(val, setMonthlyContribution, 'monthlyContribution')}
              keyboardType="decimal-pad"
              placeholder={t('calculator.placeholder.monthly')}
            />
            {errors.monthlyContribution ? <Text style={styles.errorText}>{errors.monthlyContribution}</Text> : null}

            <Text style={[styles.label, { fontSize: fontSize.medium }]}>{t('calculator.expectedReturn')}</Text>
            <TextInput
              style={[styles.input, errors.expectedReturn ? styles.inputError : null, { fontSize: fontSize.medium }]}
              value={expectedReturn}
              onChangeText={(val) => handleMoneyInput(val, setExpectedReturn, 'expectedReturn')}
              keyboardType="decimal-pad"
              placeholder={t('calculator.placeholder.return')}
            />
            {errors.expectedReturn ? <Text style={styles.errorText}>{errors.expectedReturn}</Text> : null}

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
    backgroundColor: '#48BB78',
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
    color: '#48BB78',
    fontWeight: '600',
  },
  resultAmount: {
    color: '#48BB78',
    fontWeight: 'bold',
    marginTop: 8,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});

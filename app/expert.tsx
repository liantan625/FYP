import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

const QUICK_QUESTIONS = [
  { id: 1, question: 'Bagaimana cara mula menyimpan untuk persaraan?', emoji: '🏦' },
  { id: 2, question: 'Apakah pelaburan terbaik untuk pemula?', emoji: '📈' },
  { id: 3, question: 'Bagaimana mengurus hutang dengan bijak?', emoji: '💳' },
  { id: 4, question: 'Berapa banyak perlu disimpan setiap bulan?', emoji: '💰' },
];

export default function ExpertScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const askQuestion = async (q: string) => {
    setQuestion(q);
    setIsLoading(true);
    
    // Simulate API call - replace with actual AI/expert API
    setTimeout(() => {
      setAnswer(
        `Terima kasih atas soalan anda: "${q}"\n\n` +
        `Berikut adalah nasihat kewangan:\n\n` +
        `1. Mulakan dengan menetapkan matlamat kewangan yang jelas.\n\n` +
        `2. Simpan sekurang-kurangnya 20% daripada pendapatan bulanan anda.\n\n` +
        `3. Elakkan hutang yang tidak perlu dan bayar hutang sedia ada secepat mungkin.\n\n` +
        `4. Pertimbangkan untuk melabur dalam dana yang sesuai dengan profil risiko anda.\n\n` +
        `5. Sentiasa ada dana kecemasan untuk 3-6 bulan perbelanjaan.`
      );
      setIsLoading(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (question.trim()) {
      askQuestion(question);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>👨‍💼 Tanya Pakar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.introCard}>
          <Text style={[styles.introTitle, { fontSize: fontSize.medium }]}>
            Ada soalan kewangan?
          </Text>
          <Text style={[styles.introText, { fontSize: fontSize.small }]}>
            Tanya pakar kewangan kami untuk mendapatkan nasihat yang berguna.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>Soalan Popular</Text>
        <View style={styles.quickQuestionsContainer}>
          {QUICK_QUESTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickQuestionCard}
              onPress={() => askQuestion(item.question)}
            >
              <Text style={styles.quickQuestionEmoji}>{item.emoji}</Text>
              <Text style={[styles.quickQuestionText, { fontSize: fontSize.small }]}>
                {item.question}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>Tanya Soalan Anda</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { fontSize: fontSize.medium }]}
            value={question}
            onChangeText={setQuestion}
            placeholder="Taip soalan anda di sini..."
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.loadingText, { fontSize: fontSize.small }]}>
              Mendapatkan jawapan...
            </Text>
          </View>
        )}

        {answer && !isLoading && (
          <View style={styles.answerCard}>
            <Text style={[styles.answerTitle, { fontSize: fontSize.medium }]}>💡 Jawapan Pakar</Text>
            <Text style={[styles.answerText, { fontSize: fontSize.small }]}>{answer}</Text>
          </View>
        )}
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
  introCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  introTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  introText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickQuestionsContainer: {
    marginBottom: 24,
  },
  quickQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickQuestionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  quickQuestionText: {
    flex: 1,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 14,
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
  },
  answerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  answerTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  answerText: {
    color: '#666',
    lineHeight: 22,
  },
});

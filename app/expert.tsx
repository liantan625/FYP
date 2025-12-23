import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';
import { sendMessageToAI } from './services/api';

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
    setAnswer(''); // Clear previous answer
    
    try {
      const reply = await sendMessageToAI(q);
      setAnswer(reply);
    } catch (error) {
      console.error(error);
      setAnswer("Maaf, saya tidak dapat menghubungi pelayan AI pada masa ini.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (question.trim()) {
      askQuestion(question);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>👨‍💼 Tanya Pakar</Text>
            <View style={{ width: 40 }} />
          </View>

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
          
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[styles.inputContainer, Platform.OS === 'android' && { paddingBottom: 20 }]}>
          <TextInput
            style={[styles.input, { fontSize: fontSize.medium }]}
            value={question}
            onChangeText={setQuestion}
            placeholder="Taip soalan anda di sini..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.submitButton, (!question.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!question.trim() || isLoading}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 10 },
  safeArea: {
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
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
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 14,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#A5B4FC',
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

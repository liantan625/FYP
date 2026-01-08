import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';
import { sendMessageToAI } from './services/api';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Quick questions are now loaded via translations

const CHAT_STORAGE_KEY = 'expert_chat_session_v2';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export default function ExpertScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedSession = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (savedSession) {
          setMessages(JSON.parse(savedSession));
        }
      } catch (error) {
        console.error('Failed to load chat session', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const saveState = async () => {
        try {
          await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        } catch (error) {
          console.error('Failed to save chat session', error);
        }
      };
      saveState();
    }
  }, [messages, isLoaded]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    Keyboard.dismiss();

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const reply = await sendMessageToAI(text);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'ai',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('expert.errorMessage'),
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble
      ]}>
        {!isUser && (
          <Markdown style={markdownStyles as any}>
            {item.text}
          </Markdown>
        )}
        {isUser && (
          <Text style={[styles.messageText, { fontSize: fontSize.medium, color: '#fff' }]}>
            {item.text}
          </Text>
        )}
        <Text style={[
          styles.timestamp,
          { fontSize: 10, alignSelf: isUser ? 'flex-end' : 'flex-start', color: isUser ? 'rgba(255,255,255,0.7)' : '#999' }
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const markdownStyles = {
    body: {
      fontSize: fontSize.medium,
      color: '#333',
      lineHeight: 24,
    },
    heading1: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: '#333',
      marginVertical: 5,
    },
    strong: {
      fontWeight: 'bold',
      color: '#333',
    },
  };

  // Quick questions defined using translations
  const QUICK_QUESTIONS = [
    { id: 1, question: t('expert.questions.q1'), emoji: '🏦' },
    { id: 2, question: t('expert.questions.q2'), emoji: '📈' },
    { id: 3, question: t('expert.questions.q3'), emoji: '💳' },
    { id: 4, question: t('expert.questions.q4'), emoji: '💰' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle]}>{t('expert.title')}</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('expert.newSession'),
                t('expert.newSessionConfirm'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('expert.yes'),
                    style: 'destructive',
                    onPress: async () => {
                      setMessages([]);
                      try {
                        await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                  }
                ]
              );
            }}
            style={styles.closeButton}
          >
            <MaterialIcons name="refresh" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.chatContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.introTitle, { fontSize: fontSize.large }]}>
                {t('expert.emptyTitle')}
              </Text>
              <Text style={[styles.introText, { fontSize: fontSize.medium }]}>
                {t('expert.emptySubtitle')}
              </Text>
              <View style={styles.quickQuestionsContainer}>
                {QUICK_QUESTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.quickQuestionCard}
                    onPress={() => handleSend(item.question)}
                  >
                    <Text style={styles.quickQuestionEmoji}>{item.emoji}</Text>
                    <Text style={[styles.quickQuestionText, { fontSize: fontSize.small }]}>
                      {item.question}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={{ marginLeft: 8, color: '#666' }}>{t('expert.typing')}</Text>
            </View>
          )}
        </View>

        <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={[styles.input, { fontSize: fontSize.medium }]}
            value={input}
            onChangeText={setInput}
            placeholder={t('expert.placeholder')}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.submitButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA' // Lighter, cleaner background
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9', // Light green bg
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#48BB78',
  },
  contactButtonText: {
    color: '#1F2937', // Darker text for readability
    fontWeight: '600',
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1F2937',
  },
  introText: {
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  quickQuestionsContainer: {
    width: '100%',
  },
  quickQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quickQuestionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  quickQuestionText: {
    flex: 1,
    color: '#334155',
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#48BB78', // New primary green
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  messageText: {
    color: '#1F2937',
    lineHeight: 22,
  },
  timestamp: {
    marginTop: 6,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginLeft: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 12, // Fix for multiline android
    marginRight: 12,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#48BB78',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
});
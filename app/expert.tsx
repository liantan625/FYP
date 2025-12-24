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
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';
import { sendMessageToAI } from './services/api';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUICK_QUESTIONS = [
  { id: 1, question: 'Bagaimana cara mula menyimpan untuk persaraan?', emoji: '🏦' },
  { id: 2, question: 'Apakah pelaburan terbaik untuk pemula?', emoji: '📈' },
  { id: 3, question: 'Bagaimana mengurus hutang dengan bijak?', emoji: '💳' },
  { id: 4, question: 'Berapa banyak perlu disimpan setiap bulan?', emoji: '💰' },
];

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
        text: "Maaf, saya tidak dapat menghubungi pelayan AI pada masa ini.",
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}> DuitU AI</Text>
        <View style={{ width: 44 }} /> 
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
                    Ada soalan kewangan?
                    </Text>
                    <Text style={[styles.introText, { fontSize: fontSize.medium }]}>
                    Pilih soalan di bawah atau taip soalan anda sendiri.
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
                    <Text style={{ marginLeft: 8, color: '#666' }}>Sedang menaip...</Text>
                </View>
            )}
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { fontSize: fontSize.medium }]}
            value={input}
            onChangeText={setInput}
            placeholder="Taip mesej..."
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
  container: { flex: 1, backgroundColor: '#FFFFFF' }, 
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  chatContainer: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  introTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  introText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  quickQuestionsContainer: {
    width: '100%',
  },
  quickQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickQuestionEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  quickQuestionText: {
    flex: 1,
    color: '#333',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    backgroundColor: '#ECE5DD'
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#06402B', 
    borderTopRightRadius: 0,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
  },
  messageText: {
    color: '#333',
  },
  timestamp: {
    marginTop: 4,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 15,
    marginLeft: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#00D9A8',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#06402B',
  },
});
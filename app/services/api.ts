import { Platform } from 'react-native';

// ⚠️ IMPORTANT:
// iOS Simulator: use 'http://127.0.0.1:8000' or 'http://localhost:8000'
// Android Emulator: use 'http://10.0.2.2:8000' (localhost refers to the phone itself)
// Physical Device: use your computer's LAN IP, e.g., 'http://192.168.1.5:8000'

const getBaseUrl = () => {
  // If we are in development, use local IP
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'https://uvicorn-main-production-3f09.up.railway.app';
    }
    return 'https://uvicorn-main-production-3f09.up.railway.app';
  }
  // Otherwise use the production URL
  return 'https://uvicorn-main-production-3f09.up.railway.app';
};

const API_URL = `${getBaseUrl()}/api/chat`;

interface ChatResponse {
  reply: string;
  success: boolean;
}

export const sendMessageToAI = async (messageText: string, userId: string = "test_user_1"): Promise<string> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        message: messageText,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    
    // data matches your ChatResponse model: { reply: string, success: bool }
    return data.reply; 

  } catch (error) {
    console.error("Error sending message:", error);
    return "Sorry, I'm having trouble connecting to the server right now.";
  }
};

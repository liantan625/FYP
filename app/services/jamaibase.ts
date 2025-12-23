import axios from 'axios';
import { Platform } from 'react-native';

// When running locally on your computer:
// - iOS Simulator: use 'http://localhost:8000'
// - Android Emulator (Standard): use 'http://10.0.2.2:8000'
// - Android Emulator (Genymotion): use 'http://10.0.3.2:8000'
// - Physical device: use your computer's LAN IP (e.g., 'http://192.168.1.x:8000')
//   To find LAN IP: run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) in terminal

const getBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
  }
  return 'https://uvicorn-main-production-3f09.up.railway.app';
};

const API_BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type':  'application/json',
  },
});

// Types for TypeScript
export interface ChatResponse {
  reply: string;
  success: boolean;
}

// Function to send a chat message
export async function sendChatMessage(
  userId: string,
  message: string
): Promise<ChatResponse> {
  try {
    const response = await apiClient. post('/api/chat', {
      user_id: userId,
      message:  message,
    });
    return response. data;
  } catch (error) {
    console.error('Error calling AI backend:', error);
    throw error;
  }
}

// Function to check if backend is running
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.data.status === 'healthy';
  } catch {
    return false;
  }
}
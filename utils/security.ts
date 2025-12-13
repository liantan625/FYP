import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = 'user_pin';

export const hasPinSet = async (): Promise<boolean> => {
  try {
    const pin = await AsyncStorage.getItem(PIN_KEY);
    return !!pin;
  } catch (error) {
    console.error('Error checking pin:', error);
    return false;
  }
};

export const setPin = async (pin: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(PIN_KEY, pin);
  } catch (error) {
    console.error('Error setting pin:', error);
    throw error;
  }
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  try {
    const storedPin = await AsyncStorage.getItem(PIN_KEY);
    return storedPin === pin;
  } catch (error) {
    console.error('Error verifying pin:', error);
    return false;
  }
};

export const removePin = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PIN_KEY);
  } catch (error) {
    console.error('Error removing pin:', error);
    throw error;
  }
};

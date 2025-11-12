import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontScaleOptions } from '@/constants/theme';

type FontScaleKey = 'small' | 'medium' | 'large';

interface SettingsContextType {
  fontScale: number;
  fontScaleKey: FontScaleKey;
  setFontScale: (key: FontScaleKey) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const FONT_SCALE_KEY = '@font_scale_preference';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontScaleKey, setFontScaleKey] = useState<FontScaleKey>('medium');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFontScale();
  }, []);

  const loadFontScale = async () => {
    try {
      const saved = await AsyncStorage.getItem(FONT_SCALE_KEY);
      if (saved && (saved === 'small' || saved === 'medium' || saved === 'large')) {
        setFontScaleKey(saved as FontScaleKey);
      }
    } catch (error) {
      console.error('Error loading font scale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFontScale = async (key: FontScaleKey) => {
    try {
      await AsyncStorage.setItem(FONT_SCALE_KEY, key);
      setFontScaleKey(key);
    } catch (error) {
      console.error('Error saving font scale:', error);
    }
  };

  const fontScale = FontScaleOptions[fontScaleKey].value;

  return (
    <SettingsContext.Provider value={{ fontScale, fontScaleKey, setFontScale, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

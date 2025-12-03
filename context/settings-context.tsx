import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontScaleOptions } from '@/constants/theme';
import i18n from '@/i18n/config';

type FontScaleKey = 'small' | 'medium' | 'large';
type LanguageKey = 'en' | 'ms' | 'zh' | 'ta';

interface SettingsContextType {
  fontScale: number;
  fontScaleKey: FontScaleKey;
  setFontScale: (key: FontScaleKey) => Promise<void>;
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => Promise<void>;
  isLoading: boolean;
  fontSize: FontScaleKey;
  setFontSize: (size: FontScaleKey) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const FONT_SCALE_KEY = '@font_scale_preference';
const LANGUAGE_KEY = '@language_preference';

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontScaleKey, setFontScaleKey] = useState<FontScaleKey>('medium');
  const [language, setLanguageState] = useState<LanguageKey>('ms');
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSizeState] = useState<FontScaleKey>('medium');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedFontScale, savedLanguage, savedFontSize] = await Promise.all([
        AsyncStorage.getItem(FONT_SCALE_KEY),
        AsyncStorage.getItem(LANGUAGE_KEY),
        AsyncStorage.getItem('fontSize'),
      ]);
      
      if (savedFontScale && (savedFontScale === 'small' || savedFontScale === 'medium' || savedFontScale === 'large')) {
        setFontScaleKey(savedFontScale as FontScaleKey);
      }
      
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ms' || savedLanguage === 'zh' || savedLanguage === 'ta')) {
        setLanguageState(savedLanguage as LanguageKey);
        i18n.changeLanguage(savedLanguage);
      }

      if (savedFontSize && (savedFontSize === 'small' || savedFontSize === 'medium' || savedFontSize === 'large')) {
        setFontSizeState(savedFontSize as FontScaleKey);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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

  const setLanguage = async (lang: LanguageKey) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
      i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const setFontSize = async (size: FontScaleKey) => {
    try {
      await AsyncStorage.setItem('fontSize', size);
      setFontSizeState(size);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  };

  const fontScale = FontScaleOptions[fontScaleKey].value;

  return (
    <SettingsContext.Provider value={{ fontScale, fontScaleKey, setFontScale, language, setLanguage, isLoading, fontSize, setFontSize }}>
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

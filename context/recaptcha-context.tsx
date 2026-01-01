import React, { createContext, useState, useContext, useEffect } from 'react';
import { Recaptcha } from '@google-cloud/recaptcha-enterprise-react-native';

interface RecaptchaContextType {
  client: any | null;
  isReady: boolean;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
  client: null,
  isReady: false,
});

const RECAPTCHA_SITE_KEY = '6Lf3dDYsAAAAABZRqye0Yqo0bxoXgHUyLMfdJdA-';

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initRecaptcha();
  }, []);

  const initRecaptcha = async () => {
    try {
      console.log('Initializing reCAPTCHA...');
      const recaptchaClient = await Recaptcha.fetchClient(RECAPTCHA_SITE_KEY);
      setClient(recaptchaClient);
      setIsReady(true);
      console.log('reCAPTCHA initialized successfully');
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      setIsReady(false);
    }
  };

  return (
    <RecaptchaContext.Provider value={{ client, isReady }}>
      {children}
    </RecaptchaContext.Provider>
  );
}

export function useRecaptcha() {
  const context = useContext(RecaptchaContext);
  if (!context) {
    throw new Error('useRecaptcha must be used within a RecaptchaProvider');
  }
  return context;
}

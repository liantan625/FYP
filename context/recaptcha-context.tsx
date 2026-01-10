import React, { createContext, useState, useContext, useCallback } from 'react';
import { Platform } from 'react-native';

interface RecaptchaContextType {
  client: any | null;
  isReady: boolean;
  initializeRecaptcha: () => Promise<void>;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
  client: null,
  isReady: false,
  initializeRecaptcha: async () => { },
});

const RECAPTCHA_SITE_KEY = '6Lf3dDYsAAAAABZRqye0Yqo0bxoXgHUyLMfdJdA-';

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Lazy initialization - only called when needed (on signup/login screens)
  const initializeRecaptcha = useCallback(async () => {
    // Skip if already initialized or already attempted
    if (isReady || hasAttempted) {
      return;
    }

    setHasAttempted(true);

    // Only initialize on Android and in a try-catch block
    if (Platform.OS !== 'android') {
      console.log('reCAPTCHA: Skipping on non-Android platform');
      return;
    }

    try {
      console.log('Initializing reCAPTCHA lazily...');

      // Dynamic import to prevent crash on app startup
      const { Recaptcha } = await import('@google-cloud/recaptcha-enterprise-react-native');

      // Wrap in a timeout to prevent hanging on initialization failure
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('reCAPTCHA init timeout')), 10000)
      );

      const recaptchaClient = await Promise.race([
        Recaptcha.fetchClient(RECAPTCHA_SITE_KEY),
        timeoutPromise
      ]);

      setClient(recaptchaClient);
      setIsReady(true);
      console.log('reCAPTCHA initialized successfully');
    } catch (error) {
      // Fail silently - app should still work without reCAPTCHA
      console.warn('reCAPTCHA initialization failed (non-critical):', error);
      setIsReady(false);
      setClient(null);
    }
  }, [isReady, hasAttempted]);

  return (
    <RecaptchaContext.Provider value={{ client, isReady, initializeRecaptcha }}>
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

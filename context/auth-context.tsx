import React, { createContext, useState, useContext, useCallback } from 'react';

interface AuthContextType {
  confirmation: any;
  setConfirmation: (c: any) => void;
  isPinVerified: boolean;
  setPinVerified: (v: boolean) => void;
  lockApp: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [confirmation, setConfirmation] = useState<any>(null);
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);

  const setPinVerified = useCallback((verified: boolean) => {
    setIsPinVerified(verified);
  }, []);

  const lockApp = useCallback(() => {
    setIsPinVerified(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      confirmation,
      setConfirmation,
      isPinVerified,
      setPinVerified,
      lockApp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

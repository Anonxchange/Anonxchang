import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRegisterUser, useGetUser, getGetUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface TelegramContextType {
  telegramId: string;
  user: any | null;
  isLoading: boolean;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [telegramId, setTelegramId] = useState<string>("demo_user_123");
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      if (initDataUnsafe?.user?.id) {
        setTelegramId(initDataUnsafe.user.id.toString());
      }
    }
  }, []);

  const { data: user, isLoading } = useGetUser(telegramId, {
    query: {
      enabled: !!telegramId,
      queryKey: getGetUserQueryKey(telegramId)
    }
  });

  const registerUser = useRegisterUser();

  useEffect(() => {
    if (!isLoading && !user && telegramId) {
      // Auto-register mock user
      registerUser.mutate({
        data: {
          telegramId,
          username: "demouser",
          firstName: "Demo",
          lastName: "User",
          referralCode: "DEMO_" + Math.random().toString(36).substring(7)
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
        }
      });
    }
  }, [isLoading, user, telegramId, registerUser, queryClient]);

  return (
    <TelegramContext.Provider value={{ telegramId, user, isLoading }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}

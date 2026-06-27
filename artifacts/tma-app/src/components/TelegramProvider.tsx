import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const didRegister = useRef(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      if (initDataUnsafe?.user?.id) {
        setTelegramId(initDataUnsafe.user.id.toString());
      }
    }
  }, []);

  const { data: user, isLoading, isError } = useGetUser(telegramId, {
    query: {
      enabled: !!telegramId,
      retry: false,
      queryKey: getGetUserQueryKey(telegramId),
    }
  });

  const registerUser = useRegisterUser();

  useEffect(() => {
    if (!isLoading && !user && telegramId && isError && !didRegister.current) {
      didRegister.current = true;
      registerUser.mutate({
        data: {
          telegramId,
          username: "demouser",
          firstName: "Demo",
          lastName: "User",
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
        },
        onError: () => {
          didRegister.current = false;
        }
      });
    }
  }, [isLoading, user, telegramId, isError]);

  return (
    <TelegramContext.Provider value={{ telegramId, user: user ?? null, isLoading }}>
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

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRegisterUser, useGetUser, getGetUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface TelegramContextType {
  telegramId: string;
  user: any | null;
  isLoading: boolean;
  tgUser: { username?: string; firstName?: string; lastName?: string } | null;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [telegramId, setTelegramId] = useState<string>("");
  const [tgUser, setTgUser] = useState<{ username?: string; firstName?: string; lastName?: string } | null>(null);
  const queryClient = useQueryClient();
  const didRegister = useRef(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      if (initDataUnsafe?.user?.id) {
        setTelegramId(initDataUnsafe.user.id.toString());
        setTgUser({
          username: initDataUnsafe.user.username,
          firstName: initDataUnsafe.user.first_name,
          lastName: initDataUnsafe.user.last_name,
        });
      }
    }
  }, []);

  const { data: user, isLoading, isError } = useGetUser(telegramId, {
    query: {
      enabled: !!telegramId,
      retry: false,
      queryKey: getGetUserQueryKey(telegramId),
      refetchInterval: 5000,
      refetchIntervalInBackground: false,
    }
  });

  const registerUser = useRegisterUser();

  useEffect(() => {
    if (!isLoading && !user && telegramId && isError && !didRegister.current) {
      didRegister.current = true;
      registerUser.mutate({
        data: {
          telegramId,
          username: tgUser?.username ?? null,
          firstName: tgUser?.firstName ?? null,
          lastName: tgUser?.lastName ?? null,
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
    <TelegramContext.Provider value={{ telegramId, user: user ?? null, isLoading, tgUser }}>
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

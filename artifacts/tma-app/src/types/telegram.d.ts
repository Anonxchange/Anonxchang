interface TelegramWebAppUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  BackButton: { show(): void; hide(): void; onClick(fn: () => void): void };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    onClick(fn: () => void): void;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}

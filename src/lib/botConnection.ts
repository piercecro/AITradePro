export const BOT_CONNECTION_STORAGE_KEY = 'ai-trade-bot-connect-status';
export const BOT_CONNECTION_EVENT_NAME = 'aiTradeBotConnectionStateChanged';

export const readBotConnectionState = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(BOT_CONNECTION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const writeBotConnectionState = (connected: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(BOT_CONNECTION_STORAGE_KEY, String(connected));
    window.dispatchEvent(
      new CustomEvent(BOT_CONNECTION_EVENT_NAME, {
        detail: { connected },
      }),
    );
  } catch {
    // Ignore storage issues in restricted environments.
  }
};

export const subscribeBotConnectionState = (callback: (connected: boolean) => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = () => {
    callback(readBotConnectionState());
  };

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ connected: boolean }>;
    callback(customEvent.detail?.connected ?? readBotConnectionState());
  };

  callback(readBotConnectionState());
  window.addEventListener('storage', handleStorage);
  window.addEventListener(BOT_CONNECTION_EVENT_NAME, handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(BOT_CONNECTION_EVENT_NAME, handleCustomEvent);
  };
};

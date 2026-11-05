import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** Controls the floating chatbot from anywhere in the app. */
const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [pendingAsk, setPendingAsk] = useState(null);

  /** Open the chat; optionally send a question straight away. */
  const ask = useCallback((text) => {
    setOpen(true);
    if (text) setPendingAsk({ text, at: Date.now() });
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, ask, pendingAsk, clearPending: () => setPendingAsk(null) }),
    [open, ask, pendingAsk]
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};

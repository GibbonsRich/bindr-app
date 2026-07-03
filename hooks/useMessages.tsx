import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { showAlert } from '@/lib/alert';
import {
  addInboundReply,
  addOutboundMessage,
  FAKE_REPLY_DELAY_MS,
  getUnreadCount,
  groupMessagesIntoThreads,
  loadMessages,
  markThreadRead,
  pickFakeReply,
  threadKey,
} from '@/lib/messages';
import type { MessageThread, TradeMessage } from '@/types/message';

type Collector = {
  collectorId: string;
  collectorName: string;
  cardName: string;
  set: string;
};

type SendOptions = {
  promptReply?: boolean;
};

type MessagesContextValue = {
  messages: TradeMessage[];
  threads: MessageThread[];
  unreadCount: number;
  typingThreadKeys: Set<string>;
  ready: boolean;
  refreshMessages: () => Promise<void>;
  sendTradeMessage: (body: string, collector: Collector, options?: SendOptions) => Promise<void>;
  sendReply: (body: string, collector: Collector) => Promise<void>;
  markThreadAsRead: (collectorId: string, cardName: string, set: string) => Promise<void>;
  isThreadTyping: (collectorId: string, cardName: string, set: string) => boolean;
};

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [typingThreadKeys, setTypingThreadKeys] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const replyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const refreshMessages = useCallback(async () => {
    const loaded = await loadMessages();
    setMessages(loaded);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const loaded = await loadMessages();
      if (active) {
        setMessages(loaded);
        setReady(true);
      }
    })();

    return () => {
      active = false;
      replyTimers.current.forEach(clearTimeout);
      replyTimers.current = [];
    };
  }, []);

  const queueFakeReply = useCallback(
    (collector: Collector, promptReply: boolean) => {
      const key = threadKey(collector.collectorId, collector.cardName, collector.set);
      setTypingThreadKeys((current) => new Set(current).add(key));

      const timer = setTimeout(async () => {
        const replyBody = pickFakeReply(collector.cardName, collector.collectorName);
        const updated = await addInboundReply(replyBody, collector);
        setMessages(updated);
        setTypingThreadKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });

        if (promptReply) {
          showAlert(`${collector.collectorName} replied`, replyBody);
        }
      }, FAKE_REPLY_DELAY_MS);

      replyTimers.current.push(timer);
    },
    []
  );

  const sendTradeMessage = useCallback(
    async (body: string, collector: Collector, options?: SendOptions) => {
      const updated = await addOutboundMessage(body, collector);
      setMessages(updated);
      queueFakeReply(collector, options?.promptReply !== false);
    },
    [queueFakeReply]
  );

  const sendReply = useCallback(
    async (body: string, collector: Collector) => {
      const updated = await addOutboundMessage(body, collector);
      setMessages(updated);
      queueFakeReply(collector, false);
    },
    [queueFakeReply]
  );

  const markThreadAsRead = useCallback(
    async (collectorId: string, cardName: string, set: string) => {
      const updated = await markThreadRead(collectorId, cardName, set);
      setMessages(updated);
    },
    []
  );

  const isThreadTyping = useCallback(
    (collectorId: string, cardName: string, set: string) =>
      typingThreadKeys.has(threadKey(collectorId, cardName, set)),
    [typingThreadKeys]
  );

  const threads = useMemo(() => groupMessagesIntoThreads(messages), [messages]);
  const unreadCount = useMemo(() => getUnreadCount(messages), [messages]);

  const value = useMemo(
    () => ({
      messages,
      threads,
      unreadCount,
      typingThreadKeys,
      ready,
      refreshMessages,
      sendTradeMessage,
      sendReply,
      markThreadAsRead,
      isThreadTyping,
    }),
    [
      messages,
      threads,
      unreadCount,
      typingThreadKeys,
      ready,
      refreshMessages,
      sendTradeMessage,
      sendReply,
      markThreadAsRead,
      isThreadTyping,
    ]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return context;
}

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
  deleteThreadMessages,
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
  deleteThread: (collectorId: string, cardName: string, set: string) => Promise<void>;
  isThreadTyping: (collectorId: string, cardName: string, set: string) => boolean;
};

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [typingThreadKeys, setTypingThreadKeys] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const replyTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
      replyTimers.current.clear();
    };
  }, []);

  const clearTypingForThread = useCallback((key: string) => {
    setTypingThreadKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  const cancelPendingReply = useCallback(
    (collectorId: string, cardName: string, set: string) => {
      const key = threadKey(collectorId, cardName, set);
      const timer = replyTimers.current.get(key);
      if (timer) {
        clearTimeout(timer);
        replyTimers.current.delete(key);
      }
      clearTypingForThread(key);
    },
    [clearTypingForThread]
  );

  const queueFakeReply = useCallback(
    (collector: Collector, promptReply: boolean) => {
      const key = threadKey(collector.collectorId, collector.cardName, collector.set);
      const existing = replyTimers.current.get(key);
      if (existing) clearTimeout(existing);

      setTypingThreadKeys((current) => new Set(current).add(key));

      const timer = setTimeout(async () => {
        replyTimers.current.delete(key);
        const replyBody = pickFakeReply(collector.cardName, collector.collectorName);
        const updated = await addInboundReply(replyBody, collector);
        setMessages(updated);
        clearTypingForThread(key);

        if (promptReply) {
          showAlert(`${collector.collectorName} replied`, replyBody);
        }
      }, FAKE_REPLY_DELAY_MS);

      replyTimers.current.set(key, timer);
    },
    [clearTypingForThread]
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

  const deleteThread = useCallback(
    async (collectorId: string, cardName: string, set: string) => {
      cancelPendingReply(collectorId, cardName, set);
      const updated = await deleteThreadMessages(collectorId, cardName, set);
      setMessages(updated);
    },
    [cancelPendingReply]
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
      deleteThread,
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
      deleteThread,
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

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MessageThread, NewTradeMessage, TradeMessage } from '@/types/message';

const MESSAGES_KEY = '@bindr/messages';

const DEMO_REPLIES = [
  "Hey! I might be open to a trade. What cards do you have in your portfolio?",
  "Thanks for reaching out — send me a list of what you're willing to swap.",
  "I'm interested. Would you meet halfway on value or do a straight trade?",
  "Sounds good — I'm free to meet locally this weekend if you want to swap.",
  "Let me check my binder and get back to you on that trade.",
];

export const FAKE_REPLY_DELAY_MS = 2000;

export function pickFakeReply(cardName: string, collectorName: string): string {
  const contextual = [
    `Hey! I'd consider a trade for that ${cardName}. What do you have in mind?`,
    `Thanks for messaging, ${collectorName} here — send me what you'd swap for the ${cardName}.`,
    `I'm open to a trade on ${cardName}. Got any holos or alt arts you'd move?`,
  ];
  const pool = [...contextual, ...DEMO_REPLIES];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildThreadId(collectorId: string, cardName: string, set: string): string {
  return encodeURIComponent(`${collectorId}|${cardName}|${set}`);
}

export function parseThreadId(threadId: string): {
  collectorId: string;
  cardName: string;
  set: string;
} | null {
  try {
    const decoded = decodeURIComponent(threadId);
    const separator = decoded.indexOf('|');
    const lastSeparator = decoded.lastIndexOf('|');
    if (separator <= 0 || lastSeparator <= separator) return null;

    return {
      collectorId: decoded.slice(0, separator),
      cardName: decoded.slice(separator + 1, lastSeparator),
      set: decoded.slice(lastSeparator + 1),
    };
  } catch {
    return null;
  }
}

export function threadKey(collectorId: string, cardName: string, set: string): string {
  return `${collectorId}|${cardName}|${set}`;
}

export function groupMessagesIntoThreads(messages: TradeMessage[]): MessageThread[] {
  const map = new Map<string, TradeMessage[]>();

  for (const message of messages) {
    const key = threadKey(message.collectorId, message.cardName, message.set);
    const list = map.get(key) ?? [];
    list.push(message);
    map.set(key, list);
  }

  return Array.from(map.values())
    .map((threadMessages) => {
      const sorted = [...threadMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const first = sorted[0];

      return {
        threadId: buildThreadId(first.collectorId, first.cardName, first.set),
        collectorId: first.collectorId,
        collectorName: first.collectorName,
        cardName: first.cardName,
        set: first.set,
        messages: sorted,
        lastMessage: sorted[sorted.length - 1],
        unreadCount: sorted.filter((message) => !message.read && message.direction === 'inbound')
          .length,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
}

export async function loadMessages(): Promise<TradeMessage[]> {
  const raw = await AsyncStorage.getItem(MESSAGES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveMessages(messages: TradeMessage[]): Promise<void> {
  await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export async function addMessage(message: NewTradeMessage): Promise<TradeMessage[]> {
  const messages = await loadMessages();
  const entry: TradeMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: message.direction === 'outbound',
  };
  messages.unshift(entry);
  await saveMessages(messages);
  return messages;
}

export async function addOutboundMessage(
  body: string,
  collector: { collectorId: string; collectorName: string; cardName: string; set: string }
): Promise<TradeMessage[]> {
  return addMessage({
    direction: 'outbound',
    collectorId: collector.collectorId,
    collectorName: collector.collectorName,
    cardName: collector.cardName,
    set: collector.set,
    body,
  });
}

export async function addInboundReply(
  body: string,
  collector: { collectorId: string; collectorName: string; cardName: string; set: string }
): Promise<TradeMessage[]> {
  return addMessage({
    direction: 'inbound',
    collectorId: collector.collectorId,
    collectorName: collector.collectorName,
    cardName: collector.cardName,
    set: collector.set,
    body,
  });
}

/** @deprecated Use addOutboundMessage + delayed addInboundReply */
export async function addTradeConversation(
  outboundBody: string,
  collector: { collectorId: string; collectorName: string; cardName: string; set: string }
): Promise<TradeMessage[]> {
  let messages = await addOutboundMessage(outboundBody, collector);
  const reply = pickFakeReply(collector.cardName, collector.collectorName);
  messages = await addInboundReply(reply, collector);
  return messages;
}

/** @deprecated Use addOutboundMessage + delayed addInboundReply */
export async function sendThreadReply(
  body: string,
  collector: { collectorId: string; collectorName: string; cardName: string; set: string }
): Promise<TradeMessage[]> {
  let messages = await addOutboundMessage(body, collector);
  const reply = pickFakeReply(collector.cardName, collector.collectorName);
  messages = await addInboundReply(reply, collector);
  return messages;
}

export async function markThreadRead(
  collectorId: string,
  cardName: string,
  set: string
): Promise<TradeMessage[]> {
  const messages = await loadMessages();
  const updated = messages.map((message) =>
    message.collectorId === collectorId &&
    message.cardName === cardName &&
    message.set === set
      ? { ...message, read: true }
      : message
  );
  await saveMessages(updated);
  return updated;
}

export async function markAllMessagesRead(): Promise<TradeMessage[]> {
  const messages = await loadMessages();
  const updated = messages.map((message) => ({ ...message, read: true }));
  await saveMessages(updated);
  return updated;
}

export function getUnreadCount(messages: TradeMessage[]): number {
  return messages.filter((message) => !message.read).length;
}

export function formatMessageTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatChatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatInboxTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return formatChatTime(isoDate);
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function collectorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

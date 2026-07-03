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
  return encodeThreadKeyForRoute(threadKey(collectorId, cardName, set));
}

function encodeThreadKeyForRoute(key: string): string {
  const uriEncoded = encodeURIComponent(key);
  const bytes: number[] = [];

  for (let index = 0; index < uriEncoded.length; ) {
    if (uriEncoded[index] === '%') {
      bytes.push(parseInt(uriEncoded.slice(index + 1, index + 3), 16));
      index += 3;
    } else {
      bytes.push(uriEncoded.charCodeAt(index));
      index += 1;
    }
  }

  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeThreadKeyFromRoute(routeId: string): string | null {
  if (!/^[0-9a-f]+$/i.test(routeId) || routeId.length % 2 !== 0) return null;

  try {
    const bytes = routeId.match(/.{2}/g)!.map((hex) => parseInt(hex, 16));
    let uri = '';

    for (const byte of bytes) {
      if (
        (byte >= 48 && byte <= 57) ||
        (byte >= 65 && byte <= 90) ||
        (byte >= 97 && byte <= 122) ||
        byte === 45 ||
        byte === 95 ||
        byte === 46 ||
        byte === 33 ||
        byte === 126 ||
        byte === 42 ||
        byte === 39 ||
        byte === 40 ||
        byte === 41
      ) {
        uri += String.fromCharCode(byte);
      } else {
        uri += `%${byte.toString(16).padStart(2, '0').toUpperCase()}`;
      }
    }

    return decodeURIComponent(uri);
  } catch {
    return null;
  }
}

function safeDecode(value: string): string {
  let current = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

export function parseThreadKey(key: string): {
  collectorId: string;
  cardName: string;
  set: string;
} | null {
  const parts = key.split('|');
  if (parts.length < 3) return null;

  return {
    collectorId: parts[0],
    cardName: parts.slice(1, -1).join('|'),
    set: parts[parts.length - 1],
  };
}

export function parseThreadId(threadId: string): {
  collectorId: string;
  cardName: string;
  set: string;
} | null {
  const fromHex = decodeThreadKeyFromRoute(threadId);
  if (fromHex) return parseThreadKey(fromHex);

  return parseThreadKey(safeDecode(threadId)) ?? parseThreadKey(threadId);
}

export function threadHref(thread: {
  collectorId: string;
  cardName: string;
  set: string;
}) {
  return {
    pathname: '/messages/chat' as const,
    params: {
      collectorId: thread.collectorId,
      cardName: thread.cardName,
      set: thread.set,
    },
  };
}

export function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function findThreadByDetails(
  threads: MessageThread[],
  messages: TradeMessage[],
  collectorId: string,
  cardName: string,
  set: string
): MessageThread | null {
  return findThreadByRouteId(threads, messages, undefined, { collectorId, cardName, set });
}

export function findThreadByRouteId(
  threads: MessageThread[],
  messages: TradeMessage[],
  routeThreadId: string | string[] | undefined,
  routeMeta?: {
    collectorId?: string | string[];
    cardName?: string | string[];
    set?: string | string[];
  }
): MessageThread | null {
  const paramCollectorId = firstSearchParam(routeMeta?.collectorId);
  const paramCardName = firstSearchParam(routeMeta?.cardName);
  const paramSet = firstSearchParam(routeMeta?.set);

  if (paramCollectorId && paramCardName && paramSet) {
    const fromParams = threads.find(
      (thread) =>
        thread.collectorId === paramCollectorId &&
        thread.cardName === paramCardName &&
        thread.set === paramSet
    );
    if (fromParams) return fromParams;
  }

  if (!routeThreadId) {
    if (paramCollectorId && paramCardName && paramSet) {
      return buildThreadFromMeta(
        { collectorId: paramCollectorId, cardName: paramCardName, set: paramSet },
        messages
      );
    }
    return null;
  }

  const raw = Array.isArray(routeThreadId) ? routeThreadId[0] : routeThreadId;
  const decoded = safeDecode(raw);

  for (const candidate of [raw, decoded, buildThreadIdFromDecoded(decoded)]) {
    if (!candidate) continue;
    const match = threads.find((thread) => thread.threadId === candidate);
    if (match) return match;
  }

  const meta =
    parseThreadId(raw) ??
    parseThreadKey(decoded) ??
    parseThreadKey(raw) ??
    (paramCollectorId && paramCardName && paramSet
      ? { collectorId: paramCollectorId, cardName: paramCardName, set: paramSet }
      : null);

  if (!meta) return null;

  const existing = threads.find(
    (thread) =>
      thread.collectorId === meta.collectorId &&
      thread.cardName === meta.cardName &&
      thread.set === meta.set
  );
  if (existing) return existing;

  return buildThreadFromMeta(meta, messages);
}

function buildThreadFromMeta(
  meta: { collectorId: string; cardName: string; set: string },
  messages: TradeMessage[]
): MessageThread | null {
  const threadMessages = messages
    .filter(
      (message) =>
        message.collectorId === meta.collectorId &&
        message.cardName === meta.cardName &&
        message.set === meta.set
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (threadMessages.length === 0) return null;

  const first = threadMessages[0];
  return {
    threadId: buildThreadId(first.collectorId, first.cardName, first.set),
    collectorId: first.collectorId,
    collectorName: first.collectorName,
    cardName: first.cardName,
    set: first.set,
    messages: threadMessages,
    lastMessage: threadMessages[threadMessages.length - 1],
    unreadCount: threadMessages.filter(
      (message) => !message.read && message.direction === 'inbound'
    ).length,
  };
}

function buildThreadIdFromDecoded(decoded: string): string | null {
  const meta = parseThreadKey(decoded);
  if (!meta) return null;
  return buildThreadId(meta.collectorId, meta.cardName, meta.set);
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

export async function deleteThreadMessages(
  collectorId: string,
  cardName: string,
  set: string
): Promise<TradeMessage[]> {
  const messages = await loadMessages();
  const updated = messages.filter(
    (message) =>
      !(
        message.collectorId === collectorId &&
        message.cardName === cardName &&
        message.set === set
      )
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

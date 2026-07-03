export type TradeMessage = {
  id: string;
  direction: 'outbound' | 'inbound';
  collectorId: string;
  collectorName: string;
  cardName: string;
  set: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type NewTradeMessage = Omit<TradeMessage, 'id' | 'createdAt' | 'read'>;

export type MessageThread = {
  threadId: string;
  collectorId: string;
  collectorName: string;
  cardName: string;
  set: string;
  messages: TradeMessage[];
  lastMessage: TradeMessage;
  unreadCount: number;
};

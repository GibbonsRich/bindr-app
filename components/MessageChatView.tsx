import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import DeleteThreadButton from '@/components/DeleteThreadButton';
import NotificationButton from '@/components/NotificationButton';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useMessages } from '@/hooks/useMessages';
import { formatChatTime, threadKey } from '@/lib/messages';
import type { MessageThread, TradeMessage } from '@/types/message';

type Props = {
  thread: MessageThread;
  onBack: () => void;
  onDelete?: () => void;
};

export default function MessageChatView({ thread, onBack, onDelete }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { ready, sendReply, markThreadAsRead, isThreadTyping, threads } = useMessages();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<TradeMessage>>(null);

  const liveThread = useMemo(() => {
    const key = threadKey(thread.collectorId, thread.cardName, thread.set);
    return (
      threads.find(
        (entry) => threadKey(entry.collectorId, entry.cardName, entry.set) === key
      ) ?? thread
    );
  }, [thread, threads]);

  const markRead = useCallback(() => {
    void markThreadAsRead(liveThread.collectorId, liveThread.cardName, liveThread.set);
  }, [markThreadAsRead, liveThread.collectorId, liveThread.cardName, liveThread.set]);

  useFocusEffect(
    useCallback(() => {
      if (ready) markRead();
    }, [ready, markRead])
  );

  async function handleSend() {
    if (!draft.trim() || sending) return;

    setSending(true);
    try {
      await sendReply(draft.trim(), {
        collectorId: liveThread.collectorId,
        collectorName: liveThread.collectorName,
        cardName: liveThread.cardName,
        set: liveThread.set,
      });
      setDraft('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Pokemon.red} />
      </View>
    );
  }

  const typing = isThreadTyping(liveThread.collectorId, liveThread.cardName, liveThread.set);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View style={styles.flex} lightColor={theme.background} darkColor={theme.background}>
        <View style={styles.header} lightColor={theme.surface} darkColor={theme.surface}>
          <View style={styles.headerRow} lightColor="transparent" darkColor="transparent">
            <Pressable onPress={onBack} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Messages</Text>
            </Pressable>
            <View style={styles.headerActions} lightColor="transparent" darkColor="transparent">
              {onDelete ? (
                <DeleteThreadButton
                  onPress={onDelete}
                  accessibilityLabel={`Delete chat with ${liveThread.collectorName}`}
                />
              ) : null}
              <NotificationButton />
            </View>
          </View>
          <Text style={styles.headerName}>{liveThread.collectorName}</Text>
          <Text style={styles.headerMeta}>
            {liveThread.cardName} · {liveThread.set}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          style={styles.flex}
          data={liveThread.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            typing ? <TypingBubble collectorName={liveThread.collectorName} /> : null
          }
          renderItem={({ item }) => (
            <ChatBubble message={item} isMine={item.direction === 'outbound'} />
          )}
        />

        <View style={styles.composer} lightColor={theme.surface} darkColor={theme.surface}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message about a trade…"
            placeholderTextColor={
              scheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(29,45,94,0.45)'
            }
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || sending}>
            <Text style={styles.sendText}>{sending ? '…' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function TypingBubble({ collectorName }: { collectorName: string }) {
  return (
    <View style={styles.bubbleRowTheirs} pointerEvents="none">
      <View
        style={styles.typingBubble}
        lightColor={Colors.light.surfaceAlt}
        darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.typingText}>{collectorName} is typing…</Text>
      </View>
    </View>
  );
}

function ChatBubble({ message, isMine }: { message: TradeMessage; isMine: boolean }) {
  return (
    <View
      style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
      pointerEvents="none">
      <View
        style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
        lightColor={isMine ? Pokemon.blue : Colors.light.surfaceAlt}
        darkColor={isMine ? Pokemon.blue : Colors.dark.surfaceAlt}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
          {formatChatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minHeight: 0,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  backLink: {
    paddingVertical: 4,
  },
  backLinkText: {
    color: Pokemon.blue,
    fontSize: 15,
    fontWeight: '700',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerMeta: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.65,
  },
  chatList: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bubbleRow: {
    marginBottom: 8,
    maxWidth: '82%',
  },
  bubbleRowMine: {
    alignSelf: 'flex-end',
  },
  bubbleRowTheirs: {
    alignSelf: 'flex-start',
  },
  typingBubble: {
    borderBottomLeftRadius: 4,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 6,
    opacity: 0.55,
    textAlign: 'right',
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.85)',
    opacity: 1,
  },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingBottom: 16,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: Pokemon.red,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
});

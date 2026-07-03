import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import NotificationButton from '@/components/NotificationButton';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useMessages } from '@/hooks/useMessages';
import { formatChatTime, parseThreadId } from '@/lib/messages';
import type { TradeMessage } from '@/types/message';

export default function MessageThreadScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { threads, refreshMessages, sendReply, markThreadAsRead, isThreadTyping } = useMessages();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<TradeMessage>>(null);

  const threadMeta = useMemo(() => (threadId ? parseThreadId(threadId) : null), [threadId]);

  const thread = useMemo(
    () => threads.find((item) => item.threadId === threadId) ?? null,
    [threads, threadId]
  );

  useFocusEffect(
    useCallback(() => {
      void refreshMessages();
      if (threadMeta) {
        void markThreadAsRead(threadMeta.collectorId, threadMeta.cardName, threadMeta.set);
      }
    }, [refreshMessages, markThreadAsRead, threadMeta])
  );

  async function handleSend() {
    if (!thread || !draft.trim() || sending) return;

    setSending(true);
    try {
      await sendReply(draft.trim(), {
        collectorId: thread.collectorId,
        collectorName: thread.collectorName,
        cardName: thread.cardName,
        set: thread.set,
      });
      setDraft('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } finally {
      setSending(false);
    }
  }

  if (!threadId || !threadMeta || !thread) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Conversation not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to messages</Text>
        </Pressable>
      </View>
    );
  }

  const typing = isThreadTyping(thread.collectorId, thread.cardName, thread.set);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View style={styles.flex} lightColor={theme.background} darkColor={theme.background}>
        <View style={styles.header} lightColor={theme.surface} darkColor={theme.surface}>
          <View style={styles.headerRow} lightColor="transparent" darkColor="transparent">
            <Pressable onPress={() => router.back()} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Messages</Text>
            </Pressable>
            <NotificationButton />
          </View>
          <Text style={styles.headerName}>{thread.collectorName}</Text>
          <Text style={styles.headerMeta}>
            {thread.cardName} · {thread.set}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={thread.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={typing ? <TypingBubble collectorName={thread.collectorName} /> : null}
          renderItem={({ item }) => (
            <ChatBubble message={item} isMine={item.direction === 'outbound'} />
          )}
        />

        <View style={styles.composer} lightColor={theme.surface} darkColor={theme.surface}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message about a trade…"
            placeholderTextColor={scheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(29,45,94,0.45)'}
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
    <View style={styles.bubbleRowTheirs} lightColor="transparent" darkColor="transparent">
      <View style={styles.typingBubble} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
        <Text style={styles.typingText}>{collectorName} is typing…</Text>
      </View>
    </View>
  );
}

function ChatBubble({ message, isMine }: { message: TradeMessage; isMine: boolean }) {
  return (
    <View
      style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
      lightColor="transparent"
      darkColor="transparent">
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
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Pokemon.blue,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
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
  bubbleRowTheirs: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    maxWidth: '82%',
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

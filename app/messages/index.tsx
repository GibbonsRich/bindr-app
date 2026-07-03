import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DeleteThreadButton from '@/components/DeleteThreadButton';
import MessageChatView from '@/components/MessageChatView';
import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useMessages } from '@/hooks/useMessages';
import { confirmDeleteThread } from '@/lib/deleteThread';
import { collectorInitials, formatInboxTime, threadKey } from '@/lib/messages';
import type { MessageThread } from '@/types/message';

export default function MessagesInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { threads, refreshMessages, unreadCount, deleteThread } = useMessages();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshMessages();
    }, [refreshMessages])
  );

  const activeThread = useMemo(() => {
    if (!selectedKey) return null;
    return (
      threads.find((thread) => threadKey(thread.collectorId, thread.cardName, thread.set) === selectedKey) ??
      null
    );
  }, [selectedKey, threads]);

  function openThread(thread: MessageThread) {
    setSelectedKey(threadKey(thread.collectorId, thread.cardName, thread.set));
  }

  function closeThread() {
    setSelectedKey(null);
  }

  function handleDeleteThread(thread: MessageThread) {
    confirmDeleteThread(thread, () => {
      const key = threadKey(thread.collectorId, thread.cardName, thread.set);
      if (selectedKey === key) {
        setSelectedKey(null);
      }
      void deleteThread(thread.collectorId, thread.cardName, thread.set);
    });
  }

  return (
    <RNView
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: theme.background },
      ]}>
      {activeThread ? (
        <MessageChatView
          thread={activeThread}
          onBack={closeThread}
          onDelete={() => handleDeleteThread(activeThread)}
        />
      ) : (
        <View style={styles.screen} lightColor={theme.background} darkColor={theme.background}>
          <View style={styles.header} lightColor={theme.surface} darkColor={theme.surface}>
            <Pressable onPress={() => router.back()} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Messages</Text>
            {unreadCount > 0 ? (
              <Text style={styles.unreadSummary}>
                {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
              </Text>
            ) : (
              <Text style={styles.unreadSummary}>Trade chats with collectors</Text>
            )}
          </View>

          {threads.length === 0 ? (
            <View style={styles.emptyWrap} lightColor="transparent" darkColor="transparent">
              <View
                style={styles.empty}
                lightColor={Colors.light.surfaceAlt}
                darkColor={Colors.dark.surfaceAlt}>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>
                  Message a collector from the Match tab to start a trade conversation.
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              style={styles.listFlex}
              data={threads}
              keyExtractor={(item) => threadKey(item.collectorId, item.cardName, item.set)}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <SmsThreadRow
                  thread={item}
                  onPress={() => openThread(item)}
                  onDelete={() => handleDeleteThread(item)}
                />
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.separator} lightColor={theme.border} darkColor={theme.border} />
              )}
            />
          )}
        </View>
      )}
    </RNView>
  );
}

function SmsThreadRow({
  thread,
  onPress,
  onDelete,
}: {
  thread: MessageThread;
  onPress: () => void;
  onDelete: () => void;
}) {
  const unread = thread.unreadCount > 0;
  const previewPrefix = thread.lastMessage.direction === 'outbound' ? 'You: ' : '';

  return (
    <RNView style={styles.rowContainer}>
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={onPress}
        style={styles.rowMain}
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${thread.collectorName}`}>
        <RNView pointerEvents="none" style={styles.row}>
          <View style={styles.avatarWrap} lightColor="transparent" darkColor="transparent">
            {unread ? <RNView style={styles.unreadDot} /> : null}
            <View style={styles.avatar} lightColor={Pokemon.blue} darkColor={Pokemon.blue}>
              <Text style={styles.avatarText}>{collectorInitials(thread.collectorName)}</Text>
            </View>
          </View>

          <View style={styles.rowBody} lightColor="transparent" darkColor="transparent">
            <View style={styles.rowTop} lightColor="transparent" darkColor="transparent">
              <Text style={[styles.rowName, unread && styles.rowNameUnread]} numberOfLines={1}>
                {thread.collectorName}
              </Text>
              <Text style={[styles.rowTime, unread && styles.rowTimeUnread]}>
                {formatInboxTime(thread.lastMessage.createdAt)}
              </Text>
            </View>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {thread.cardName} · {thread.set}
            </Text>
            <RNView style={styles.rowPreviewLine}>
              <Text
                style={[styles.rowPreview, unread && styles.rowPreviewUnread]}
                numberOfLines={2}>
                {previewPrefix}
                {thread.lastMessage.body}
              </Text>
              {unread ? (
                <RNView style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                </RNView>
              ) : null}
            </RNView>
          </View>
        </RNView>
      </TouchableOpacity>
      <DeleteThreadButton
        onPress={onDelete}
        accessibilityLabel={`Delete chat with ${thread.collectorName}`}
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  screen: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backLink: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backLinkText: {
    color: Pokemon.blue,
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
  },
  unreadSummary: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.65,
  },
  list: {
    paddingBottom: 24,
  },
  listFlex: {
    flex: 1,
    minHeight: 0,
  },
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 8,
  },
  rowMain: {
    flex: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
  },
  unreadDot: {
    backgroundColor: Pokemon.red,
    borderRadius: 999,
    height: 10,
    left: 0,
    position: 'absolute',
    top: 2,
    width: 10,
    zIndex: 1,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  rowBody: {
    flex: 1,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  rowName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  rowNameUnread: {
    fontWeight: '800',
  },
  rowTime: {
    fontSize: 13,
    opacity: 0.55,
  },
  rowTimeUnread: {
    color: Pokemon.blue,
    fontWeight: '700',
    opacity: 1,
  },
  rowMeta: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.55,
  },
  rowPreviewLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rowPreview: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    opacity: 0.75,
  },
  rowPreviewUnread: {
    fontWeight: '600',
    opacity: 0.95,
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: Pokemon.red,
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 80,
    opacity: 0.35,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  empty: {
    borderRadius: 16,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    opacity: 0.65,
  },
});

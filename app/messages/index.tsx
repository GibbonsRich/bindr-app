import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useMessages } from '@/hooks/useMessages';
import { collectorInitials, formatInboxTime } from '@/lib/messages';
import type { MessageThread } from '@/types/message';

export default function MessagesInboxScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { threads, refreshMessages, unreadCount } = useMessages();

  useFocusEffect(
    useCallback(() => {
      void refreshMessages();
    }, [refreshMessages])
  );

  function openThread(thread: MessageThread) {
    router.push({
      pathname: '/messages/[threadId]',
      params: { threadId: thread.threadId },
    });
  }

  return (
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
          <View style={styles.empty} lightColor={Colors.light.surfaceAlt} darkColor={Colors.dark.surfaceAlt}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Message a collector from the Match tab to start a trade conversation.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.threadId}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} lightColor={theme.border} darkColor={theme.border} />
          )}
          renderItem={({ item }) => (
            <SmsThreadRow thread={item} onPress={() => openThread(item)} />
          )}
        />
      )}
    </View>
  );
}

function SmsThreadRow({ thread, onPress }: { thread: MessageThread; onPress: () => void }) {
  const unread = thread.unreadCount > 0;
  const previewPrefix = thread.lastMessage.direction === 'outbound' ? 'You: ' : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${thread.collectorName}`}>
      <View style={styles.avatarWrap} lightColor="transparent" darkColor="transparent">
        {unread ? <View style={styles.unreadDot} /> : null}
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
        <View style={styles.rowPreviewLine} lightColor="transparent" darkColor="transparent">
          <Text
            style={[styles.rowPreview, unread && styles.rowPreviewUnread]}
            numberOfLines={2}>
            {previewPrefix}
            {thread.lastMessage.body}
          </Text>
          {unread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.88,
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

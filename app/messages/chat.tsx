import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeading from '@/components/AppHeading';
import MessageChatView from '@/components/MessageChatView';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useMessages } from '@/hooks/useMessages';
import { confirmDeleteThread } from '@/lib/deleteThread';
import { findThreadByDetails, firstSearchParam } from '@/lib/messages';

export default function MessageChatScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { threads, messages, refreshMessages, deleteThread } = useMessages();
  const params = useLocalSearchParams<{
    collectorId?: string | string[];
    cardName?: string | string[];
    set?: string | string[];
  }>();

  const collectorId = firstSearchParam(params.collectorId);
  const cardName = firstSearchParam(params.cardName);
  const cardSet = firstSearchParam(params.set);

  useFocusEffect(
    useCallback(() => {
      void refreshMessages();
    }, [refreshMessages])
  );

  const thread = useMemo(() => {
    if (!collectorId || !cardName || !cardSet) return null;
    return findThreadByDetails(threads, messages, collectorId, cardName, cardSet);
  }, [threads, messages, collectorId, cardName, cardSet]);

  function handleDelete() {
    if (!thread) return;
    confirmDeleteThread(thread, () => {
      void deleteThread(thread.collectorId, thread.cardName, thread.set);
      router.back();
    });
  }

  if (!thread) {
    return (
      <RNView style={[styles.centered, { paddingTop: insets.top }]}>
        <AppHeading style={styles.errorTitle}>Conversation not found</AppHeading>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.action }]}>
          <Text style={[styles.backButtonText, { color: theme.actionText }]}>Back to messages</Text>
        </Pressable>
      </RNView>
    );
  }

  return (
    <RNView style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <MessageChatView
        thread={thread}
        onBack={() => router.back()}
        onDelete={handleDelete}
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    fontWeight: '700',
  },
});

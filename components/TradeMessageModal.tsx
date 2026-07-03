import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import AppHeading from '@/components/AppHeading';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { buildTradeMessage } from '@/lib/tradeMessage';
import type { CollectorListing } from '@/types/card';

type Props = {
  listing: CollectorListing | null;
  formatPrice: (amountUsd: number) => string;
  onClose: () => void;
  onSend: (listing: CollectorListing, message: string) => void;
};

export default function TradeMessageModal({ listing, formatPrice, onClose, onSend }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (listing) {
      setMessage(buildTradeMessage(listing, formatPrice));
    }
  }, [listing, formatPrice]);

  if (!listing) return null;

  return (
    <Modal visible={Boolean(listing)} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close message" />
        <View style={styles.sheet} lightColor={theme.surface} darkColor={theme.surface}>
          <AppHeading style={styles.title}>Message {listing.collectorName}</AppHeading>
          <Text style={styles.subtitle}>
            {listing.cardName} · {listing.set} · {listing.condition}
          </Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.surfaceAlt,
              },
            ]}
            placeholder="Write your trade message…"
            placeholderTextColor={scheme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(29,45,94,0.45)'}
          />

          <Text style={styles.demoNote}>
            Demo — the collector will reply with a sample message in a few seconds.
          </Text>

          <View style={styles.actions} lightColor="transparent" darkColor="transparent">
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.link }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: theme.action },
                !message.trim() && styles.disabled,
              ]}
              onPress={() => onSend(listing, message.trim())}
              disabled={!message.trim()}>
              <Text style={[styles.sendText, { color: theme.actionText }]}>Send message</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 28,
  },
  title: {
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.65,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 16,
    minHeight: 140,
    padding: 14,
  },
  demoNote: {
    fontSize: 11,
    marginTop: 10,
    opacity: 0.55,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 12,
  },
  cancelText: {
    fontWeight: '700',
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  sendText: {
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});

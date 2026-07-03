import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View as RNView } from 'react-native';

import { Text } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useMessages } from '@/hooks/useMessages';

export default function NotificationButton() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const { unreadCount } = useMessages();
  const tint = Colors[scheme].tint;

  return (
    <Pressable
      onPress={() => router.push('/messages')}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `Messages, ${unreadCount} unread` : 'Messages'
      }>
      <SymbolView
        name={{
          ios: 'bell.fill',
          android: 'notifications',
          web: 'notifications',
        }}
        tintColor={tint}
        size={24}
      />
      {unreadCount > 0 ? (
        <RNView style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </RNView>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Pokemon.red,
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});

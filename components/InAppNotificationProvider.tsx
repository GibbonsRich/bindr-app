import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors, { Pokemon } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  registerNotificationHandlers,
  type PushNotificationPayload,
  type ToastPayload,
} from '@/lib/notificationBridge';

const PUSH_DISMISS_MS = 4500;
const TOAST_DISMISS_MS = 2400;

export default function InAppNotificationProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  const [push, setPush] = useState<PushNotificationPayload | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const pushOffset = useRef(new Animated.Value(-140)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushOnPress = useRef<(() => void) | undefined>(undefined);

  const dismissPush = useCallback(() => {
    if (pushTimer.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }

    Animated.timing(pushOffset, {
      toValue: -140,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPush(null);
        pushOnPress.current = undefined;
      }
    });
  }, [pushOffset]);

  const showPush = useCallback(
    (payload: PushNotificationPayload) => {
      if (pushTimer.current) clearTimeout(pushTimer.current);

      pushOnPress.current = payload.onPress;
      setPush(payload);
      pushOffset.setValue(-140);

      Animated.spring(pushOffset, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }).start();

      pushTimer.current = setTimeout(dismissPush, PUSH_DISMISS_MS);
    },
    [dismissPush, pushOffset]
  );

  const dismissToast = useCallback(() => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }

    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [toastOpacity]);

  const showToastBanner = useCallback(
    (payload: ToastPayload) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);

      setToast(payload);
      toastOpacity.setValue(0);

      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      toastTimer.current = setTimeout(dismissToast, TOAST_DISMISS_MS);
    },
    [dismissToast, toastOpacity]
  );

  useEffect(() => {
    return registerNotificationHandlers({
      showPush,
      showToast: showToastBanner,
    });
  }, [showPush, showToastBanner]);

  useEffect(() => {
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -4,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -18) dismissPush();
      },
    })
  ).current;

  function handlePushPress() {
    dismissPush();
    pushOnPress.current?.();
  }

  return (
    <>
      {children}

      {push ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.pushHost,
            { paddingTop: insets.top + 6, transform: [{ translateY: pushOffset }] },
          ]}
          {...panResponder.panHandlers}>
          <Pressable
            onPress={handlePushPress}
            style={[
              styles.pushCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                  },
                  android: { elevation: 8 },
                  default: {},
                }),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${push.title}. ${push.body}`}>
            <RNView style={[styles.pushIcon, { backgroundColor: Pokemon.red }]}>
              <Text style={styles.pushIconText}>✉</Text>
            </RNView>
            <RNView style={styles.pushText}>
              <Text style={styles.pushTitle} numberOfLines={1}>
                {push.title}
              </Text>
              <Text style={styles.pushBody} numberOfLines={2}>
                {push.body}
              </Text>
            </RNView>
          </Pressable>
        </Animated.View>
      ) : null}

      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastHost,
            {
              bottom: insets.bottom + 88,
              opacity: toastOpacity,
            },
          ]}>
          <RNView style={[styles.toastCard, { backgroundColor: theme.surfaceAlt }]}>
            {toast.title ? <Text style={styles.toastTitle}>{toast.title}</Text> : null}
            <Text style={styles.toastMessage} numberOfLines={2}>
              {toast.message}
            </Text>
          </RNView>
        </Animated.View>
      ) : null}
    </>
  );
}

export function openMessagesInbox() {
  router.push('/messages');
}

const styles = StyleSheet.create({
  pushHost: {
    left: 12,
    position: 'absolute',
    right: 12,
    top: 0,
    zIndex: 1000,
  },
  pushCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pushIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pushIconText: {
    color: '#fff',
    fontSize: 16,
  },
  pushText: {
    flex: 1,
  },
  pushTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pushBody: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.72,
  },
  toastHost: {
    alignItems: 'center',
    left: 24,
    position: 'absolute',
    right: 24,
    zIndex: 999,
  },
  toastCard: {
    borderRadius: 999,
    maxWidth: 360,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  toastTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    opacity: 0.8,
    textAlign: 'center',
  },
  toastMessage: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

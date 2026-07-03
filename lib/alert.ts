import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { showToast } from '@/lib/notificationBridge';

export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }

  Alert.alert(title, message);
}

export function showSuccess(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }

  showToast(message, title);
}

export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: ['Cancel', confirmLabel],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
        userInterfaceStyle: 'automatic',
      },
      (index) => {
        if (index === 1) onConfirm();
      }
    );
    return;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function pickFromList(title: string, options: string[], onSelect: (index: number) => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options, 'Cancel'],
        cancelButtonIndex: options.length,
        userInterfaceStyle: 'automatic',
      },
      (index) => {
        if (index !== undefined && index < options.length) {
          onSelect(index);
        }
      }
    );
    return;
  }

  if (Platform.OS === 'web') {
    const message = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
    const input =
      typeof window !== 'undefined' ? window.prompt(`${title}\n\n${message}`, options[0]) : null;
    if (!input) return;

    const matchedIndex = options.findIndex(
      (option) => option.toLowerCase() === input.trim().toLowerCase()
    );
    if (matchedIndex >= 0) {
      onSelect(matchedIndex);
      return;
    }

    const prefixIndex = options.findIndex((option) =>
      option.toLowerCase().startsWith(input.trim().toLowerCase())
    );
    if (prefixIndex >= 0) onSelect(prefixIndex);
    return;
  }

  Alert.alert(title, undefined, [
    ...options.map((text, index) => ({
      text,
      onPress: () => onSelect(index),
    })),
    { text: 'Cancel', style: 'cancel' },
  ]);
}

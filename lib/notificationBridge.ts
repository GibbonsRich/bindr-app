export type PushNotificationPayload = {
  title: string;
  body: string;
  onPress?: () => void;
};

export type ToastPayload = {
  title?: string;
  message: string;
};

type Handlers = {
  showPush: (payload: PushNotificationPayload) => void;
  showToast: (payload: ToastPayload) => void;
};

let handlers: Handlers | null = null;

export function registerNotificationHandlers(next: Handlers) {
  handlers = next;
  return () => {
    handlers = null;
  };
}

export function showPushNotification(payload: PushNotificationPayload) {
  handlers?.showPush(payload);
}

export function showToast(message: string, title?: string) {
  handlers?.showToast({ message, title });
}

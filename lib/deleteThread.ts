import { confirmAction } from '@/lib/alert';
import type { MessageThread } from '@/types/message';

export function confirmDeleteThread(
  thread: Pick<MessageThread, 'collectorName' | 'cardName' | 'set'>,
  onConfirm: () => void
) {
  confirmAction(
    'Delete chat',
    `Delete your conversation with ${thread.collectorName} about ${thread.cardName} (${thread.set})?`,
    'Delete',
    onConfirm
  );
}

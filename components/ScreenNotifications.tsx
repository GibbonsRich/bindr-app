import { StyleSheet, View as RNView } from 'react-native';

import NotificationButton from '@/components/NotificationButton';

type Props = {
  children?: React.ReactNode;
};

/** Top-right notification icon for screens without PageHeader. */
export default function ScreenNotifications({ children }: Props) {
  return (
    <RNView style={styles.wrap}>
      <RNView style={styles.iconSlot}>
        <NotificationButton />
      </RNView>
      {children}
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  iconSlot: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
});

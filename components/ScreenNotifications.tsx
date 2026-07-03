import { StyleSheet, View as RNView } from 'react-native';

import HeaderActions from '@/components/HeaderActions';

type Props = {
  children?: React.ReactNode;
};

/** Top-right notification icon for screens without PageHeader. */
export default function ScreenNotifications({ children }: Props) {
  return (
    <RNView style={styles.wrap}>
      <RNView style={styles.iconSlot}>
        <HeaderActions />
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
    paddingHorizontal: 12,
    paddingTop: 16,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
});

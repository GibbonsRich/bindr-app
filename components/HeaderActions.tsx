import { StyleSheet, View as RNView } from 'react-native';

import DarkModeToggle from '@/components/DarkModeToggle';
import NotificationButton from '@/components/NotificationButton';

export default function HeaderActions() {
  return (
    <RNView style={styles.row}>
      <DarkModeToggle />
      <NotificationButton />
    </RNView>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
});

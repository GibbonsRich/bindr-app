import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Pokemon } from '@/constants/Colors';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export default function DeleteThreadButton({ onPress, accessibilityLabel = 'Delete chat' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <SymbolView
        name={{
          ios: 'trash',
          android: 'delete',
          web: 'delete',
        }}
        tintColor={Pokemon.red}
        size={22}
      />
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
});

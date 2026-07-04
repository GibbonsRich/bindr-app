import { Image, Modal, Pressable, StyleSheet, View as RNView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';

type Props = {
  uri: string | null;
  label?: string;
  onClose: () => void;
};

export default function FullscreenPhotoViewer({ uri, label, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const imageWidth = width - 32;
  const imageHeight = height - insets.top - insets.bottom - 96;

  return (
    <Modal visible={Boolean(uri)} animationType="fade" transparent onRequestClose={onClose}>
      <RNView style={styles.container}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close full screen photo"
        />

        {label ? (
          <Text style={[styles.label, { top: insets.top + 12 }]}>{label}</Text>
        ) : null}

        <Pressable
          style={[styles.closeButton, { top: insets.top + 8 }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <Text style={styles.closeText}>Close</Text>
        </Pressable>

        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: imageWidth, height: imageHeight }}
            resizeMode="contain"
            accessibilityLabel={label ? `${label} photo` : 'Card photo'}
          />
        ) : null}
      </RNView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.96)',
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    left: 20,
    position: 'absolute',
    zIndex: 2,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

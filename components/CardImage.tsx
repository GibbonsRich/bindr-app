import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getCardImageUri, getCardBackImageUri } from '@/lib/cardArt';

type Size = 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  name: string;
  set: string;
  imageUri?: string;
  backImageUri?: string;
  size?: Size;
  variant?: 'front' | 'back';
};

const SIZES: Record<Size, { width: number; height: number }> = {
  sm: { width: 52, height: 72 },
  md: { width: 72, height: 100 },
  lg: { width: 160, height: 224 },
  xl: { width: 148, height: 206 },
};

export default function CardImage({
  name,
  set,
  imageUri,
  backImageUri,
  size = 'md',
  variant = 'front',
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const uri =
    variant === 'back'
      ? getCardBackImageUri(backImageUri)
      : getCardImageUri(name, set, imageUri);
  const dimensions = SIZES[size];

  if (!uri) {
    return (
      <View
        style={[
          styles.placeholder,
          dimensions,
          {
            backgroundColor: Colors[scheme].surfaceAlt,
            borderColor: Colors[scheme].border,
          },
        ]}>
        <Text style={styles.placeholderText}>?</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, dimensions]}
      resizeMode="cover"
      accessibilityLabel={`${name} card ${variant}`}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 8,
    backgroundColor: '#000',
  },
  placeholder: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.35,
  },
});

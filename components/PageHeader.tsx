import { StyleSheet } from 'react-native';

import NotificationButton from '@/components/NotificationButton';
import { Text, View } from '@/components/Themed';
import { Pokemon } from '@/constants/Colors';

type Props = {
  title: string;
  description: string;
  large?: boolean;
};

export default function PageHeader({ title, description, large = false }: Props) {
  return (
    <View style={styles.wrapper} lightColor="transparent" darkColor="transparent">
      <View style={styles.titleRow} lightColor="transparent" darkColor="transparent">
        <Text style={[styles.title, large && styles.titleLarge]}>{title}</Text>
        <NotificationButton />
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
  },
  titleLarge: {
    color: Pokemon.red,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    opacity: 0.75,
  },
});

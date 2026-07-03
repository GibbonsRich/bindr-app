import { StyleSheet } from 'react-native';

import AppHeading from '@/components/AppHeading';
import NotificationButton from '@/components/NotificationButton';
import { Text, View } from '@/components/Themed';

type Props = {
  title: string;
  description: string;
  tagline?: string;
};

export default function PageHeader({ title, description, tagline }: Props) {
  return (
    <View style={styles.wrapper} lightColor="transparent" darkColor="transparent">
      <View style={styles.titleRow} lightColor="transparent" darkColor="transparent">
        <AppHeading style={styles.title}>{title}</AppHeading>
        <NotificationButton />
      </View>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
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
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.85,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    opacity: 0.75,
  },
});

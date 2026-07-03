import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';

import AppHeading from '@/components/AppHeading';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  title: string;
  subtitle?: string;
  count?: number;
  leading?: ReactNode;
  headerTrailing?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
};

export default function Accordion({
  title,
  subtitle,
  count,
  leading,
  headerTrailing,
  children,
  defaultOpen = false,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const [open, setOpen] = useState(defaultOpen);

  const heading = count !== undefined ? `${title} (${count})` : title;

  return (
    <View style={styles.wrapper} lightColor="transparent" darkColor="transparent">
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${heading}, ${open ? 'collapse' : 'expand'}`}>
        {leading ? <RNView style={styles.leading}>{leading}</RNView> : null}
        <RNView style={styles.headerText}>
          <AppHeading style={[styles.title, leading ? styles.titleCompact : null]}>
            {heading}
          </AppHeading>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </RNView>
        {!open && headerTrailing ? (
          <RNView style={styles.trailing}>{headerTrailing}</RNView>
        ) : null}
        <RNView style={[styles.chevronWrap, { backgroundColor: theme.surfaceAlt }]}>
          <SymbolView
            name={{
              ios: open ? 'chevron.up' : 'chevron.down',
              android: open ? 'expand_less' : 'expand_more',
              web: open ? 'expand_less' : 'expand_more',
            }}
            tintColor={theme.tint}
            size={18}
          />
        </RNView>
      </Pressable>
      {open ? <RNView style={styles.body}>{children}</RNView> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  leading: {
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  title: {
    marginBottom: 0,
  },
  titleCompact: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.6,
  },
  trailing: {
    alignItems: 'flex-end',
    flexShrink: 0,
    justifyContent: 'center',
    maxWidth: 108,
  },
  chevronWrap: {
    alignItems: 'center',
    borderRadius: 999,
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  body: {
    gap: 8,
  },
});

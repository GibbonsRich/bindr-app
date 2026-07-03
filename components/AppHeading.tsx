import type { TextProps, TextStyle } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export const appHeadingStyle: TextStyle = {
  fontSize: 32,
  fontWeight: '800',
  letterSpacing: -0.5,
};

type Props = TextProps & {
  children: React.ReactNode;
};

export default function AppHeading({ style, children, ...props }: Props) {
  const scheme = useColorScheme();
  const theme = Colors[scheme];

  return (
    <Text style={[appHeadingStyle, { color: theme.heading }, style]} {...props}>
      {children}
    </Text>
  );
}

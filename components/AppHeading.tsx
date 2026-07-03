import type { TextProps, TextStyle } from 'react-native';

import { Text } from '@/components/Themed';
import { Pokemon } from '@/constants/Colors';

export const appHeadingStyle: TextStyle = {
  color: Pokemon.red,
  fontSize: 32,
  fontWeight: '800',
  letterSpacing: -0.5,
};

type Props = TextProps & {
  children: React.ReactNode;
};

export default function AppHeading({ style, children, ...props }: Props) {
  return (
    <Text style={[appHeadingStyle, style]} {...props}>
      {children}
    </Text>
  );
}

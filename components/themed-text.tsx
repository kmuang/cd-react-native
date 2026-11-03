import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  defaultSemiBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.1,
  }, 
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  link: {
    lineHeight: 24,
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
});

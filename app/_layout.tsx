import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { DirectoryProvider } from '@/hooks/use-directory';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DirectoryProvider>
        <Head>
          <title>Zomi Catholic Community</title>
        </Head>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Zomi Catholic Community' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="admin" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </DirectoryProvider>
    </ThemeProvider>
  );
}

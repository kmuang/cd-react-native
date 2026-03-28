import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-household" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-leaders" options={{ presentation: 'modal' }} />
      <Stack.Screen name="change-pin" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

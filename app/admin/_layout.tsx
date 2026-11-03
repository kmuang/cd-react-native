import { Stack } from 'expo-router';
import { useState } from 'react';

import { AdminPinScreen } from '@/components/admin-pin-screen';
import { adminSession } from '@/lib/admin-session';

export default function AdminLayout() {
  const [authenticated, setAuthenticated] = useState(adminSession.isAuthenticated);

  if (!authenticated) {
    return <AdminPinScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="households" />
      <Stack.Screen name="edit-household" />
      <Stack.Screen name="edit-leaders" />
      <Stack.Screen name="change-pin" />
    </Stack>
  );
}

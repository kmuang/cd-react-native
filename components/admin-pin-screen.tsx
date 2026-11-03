import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { verifyPin } from '@/lib/admin-auth';
import { adminSession } from '@/lib/admin-session';

export function AdminPinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleSubmit = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) {
      adminSession.login();
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  };

  return (
    <SafeAreaView style={[styles.pinScreen, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <IconSymbol name="xmark" size={18} color={colors.muted} />
      </TouchableOpacity>
      <View style={styles.pinHeader}>
        <Image
          source={require('@/assets/images/catholic.png')}
          style={styles.pinLogo}
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.pinTitle}>Admin Access</ThemedText>
        <ThemedText style={[styles.pinSubtitle, { color: colors.muted }]}>
          Enter your PIN to continue
        </ThemedText>
        {error && (
          <ThemedText style={styles.pinError}>Incorrect PIN. Try again.</ThemedText>
        )}
      </View>
      <PinPad onSubmit={handleSubmit} error={error} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pinScreen: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 48 },
  backBtn: { position: 'absolute', top: 56, right: 24, padding: 8 },
  pinHeader: { alignItems: 'center', gap: 10 },
  pinLogo: { width: 80, height: 80, borderRadius: 20, marginBottom: 8 },
  pinTitle: { fontSize: 26 },
  pinSubtitle: { fontSize: 14 },
  pinError: { fontSize: 13, color: '#EF4444', marginTop: 4 },
});

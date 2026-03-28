import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { changePin } from '@/lib/admin-auth';

type Step = 'enter-new' | 'confirm';

export default function ChangePinScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [step, setStep] = useState<Step>('enter-new');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState(false);

  const handleEnterNew = (pin: string) => {
    setNewPin(pin);
    setStep('confirm');
  };

  const handleConfirm = async (pin: string) => {
    if (pin !== newPin) {
      setError(true);
      setTimeout(() => {
        setError(false);
        setStep('enter-new');
        setNewPin('');
      }, 600);
      return;
    }
    await changePin(pin);
    Alert.alert('PIN Updated', 'Your admin PIN has been changed.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/admin')}>
        <IconSymbol name="house.fill" size={18} color={colors.muted} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: colors.accent + '18' }]}>
          <IconSymbol name="key.fill" size={28} color={colors.accent} />
        </View>
        <ThemedText type="title" style={styles.title}>Change PIN</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
          {step === 'enter-new' ? 'Enter your new 4-digit PIN' : 'Confirm your new PIN'}
        </ThemedText>
        {error && (
          <ThemedText style={styles.error}>PINs don't match. Try again.</ThemedText>
        )}
      </View>

      <PinPad
        onSubmit={step === 'enter-new' ? handleEnterNew : handleConfirm}
        error={error}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    gap: 48,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    padding: 8,
  },
  content: {
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 14 },
  error: { fontSize: 13, color: '#EF4444', marginTop: 4 },
});

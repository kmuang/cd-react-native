import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Vibration } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

interface PinPadProps {
  onSubmit: (pin: string) => void;
  error?: boolean;
}

export function PinPad({ onSubmit, error }: PinPadProps) {
  const [pin, setPin] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accent = colors.accent;
  const inputRef = useRef<TextInput>(null);

  // Focus keyboard on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // Reset on error
  useEffect(() => {
    if (error) {
      Vibration.vibrate(400);
      setPin('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [error]);

  const updatePin = (next: string) => {
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => onSubmit(next), 120);
    }
  };

  // Handle physical keyboard typing
  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, PIN_LENGTH);
    updatePin(digits);
  };

  // Handle on-screen keypad
  const handleKey = (key: string) => {
    inputRef.current?.focus();
    if (key === 'del') {
      updatePin(pin.slice(0, -1));
    } else if (pin.length < PIN_LENGTH) {
      updatePin(pin + key);
    }
  };

  return (
    <View style={styles.container}>
      {/* Invisible TextInput — captures physical keyboard */}
      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        secureTextEntry
        style={styles.hiddenInput}
        caretHidden
      />

      {/* Dots — tap to open keyboard */}
      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        activeOpacity={0.8}
        style={styles.dotsRow}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < pin.length
                    ? error ? '#EF4444' : accent
                    : colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                borderColor:
                  i < pin.length
                    ? error ? '#EF4444' : accent
                    : colorScheme === 'dark' ? '#475569' : '#CBD5E1',
              },
            ]}
          />
        ))}
      </TouchableOpacity>

      {/* On-screen keypad */}
      <View style={styles.grid}>
        {KEYS.map((key, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.key,
              key === '' ? styles.keyEmpty
                : key === 'del' ? styles.keyDel
                : { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC' },
            ]}
            onPress={() => key !== '' && handleKey(key)}
            activeOpacity={key === '' ? 1 : 0.6}
            disabled={key === ''}
          >
            {key === 'del' ? (
              <IconSymbol name="delete.left" size={22} color={colors.muted} />
            ) : key !== '' ? (
              <ThemedText style={styles.keyText}>{key}</ThemedText>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 36 },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
  },
  dotsRow: { flexDirection: 'row', gap: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 264, gap: 12 },
  key: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { backgroundColor: 'transparent' },
  keyDel: { backgroundColor: 'transparent' },
  keyText: { fontSize: 24, fontWeight: '400' },
});

import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Vibration } from 'react-native';

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

  useEffect(() => {
    if (error) {
      Vibration.vibrate(400);
      setPin('');
    }
  }, [error]);

  const handleKey = (key: string) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === '') return;
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      // Small delay so the last dot fills before submitting
      setTimeout(() => onSubmit(next), 120);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dots */}
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < pin.length
                    ? error
                      ? '#EF4444'
                      : accent
                    : colorScheme === 'dark'
                      ? '#334155'
                      : '#E2E8F0',
                borderColor:
                  i < pin.length
                    ? error
                      ? '#EF4444'
                      : accent
                    : colorScheme === 'dark'
                      ? '#475569'
                      : '#CBD5E1',
              },
            ]}
          />
        ))}
      </View>

      {/* Keypad grid */}
      <View style={styles.grid}>
        {KEYS.map((key, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.key,
              key === ''
                ? styles.keyEmpty
                : key === 'del'
                  ? styles.keyDel
                  : { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC' },
            ]}
            onPress={() => handleKey(key)}
            activeOpacity={key === '' ? 1 : 0.6}
            disabled={key === ''}
          >
            {key === 'del' ? (
              <IconSymbol name="delete.left" size={22} color={colors.muted} />
            ) : (
              <ThemedText style={styles.keyText}>{key}</ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 36,
  },
  dots: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    gap: 12,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyDel: {
    backgroundColor: 'transparent',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '400',
  },
});

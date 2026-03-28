import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@admin_pin';
const DEFAULT_PIN = '1234';

export async function getStoredPin(): Promise<string> {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return pin ?? DEFAULT_PIN;
}

export async function verifyPin(input: string): Promise<boolean> {
  const stored = await getStoredPin();
  return input === stored;
}

export async function changePin(newPin: string): Promise<void> {
  await AsyncStorage.setItem(PIN_KEY, newPin);
}

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { COMMUNITY_LEADERS, type CommunityLeader } from '@/constants/directory';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';

export default function EditLeaders() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [leaders, setLeaders] = useState<CommunityLeader[]>(COMMUNITY_LEADERS);
  const [saving, setSaving] = useState(false);

  const addLeader = () => setLeaders((l) => [...l, { role: '', name: '' }]);
  const removeLeader = (i: number) => setLeaders((l) => l.filter((_, idx) => idx !== i));
  const updateLeader = (i: number, field: keyof CommunityLeader, value: string) =>
    setLeaders((l) => l.map((leader, idx) => (idx === i ? { ...leader, [field]: value } : leader)));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing leaders then re-write
      const snap = await getDocs(collection(db, 'leaders'));
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'leaders', d.id))));
      await Promise.all(
        leaders
          .filter((l) => l.name.trim())
          .map((l, i) => setDoc(doc(db, 'leaders', `leader-${i}`), { ...l, order: i })),
      );
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save leaders. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <IconSymbol name="xmark" size={18} color={colors.muted} />
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Edit Leaders</ThemedText>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
        >
          <ThemedText style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</ThemedText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {leaders.map((leader, i) => (
            <View key={i} style={styles.leaderRow}>
              <View style={styles.leaderFields}>
                <TextInput
                  value={leader.role}
                  onChangeText={(v) => updateLeader(i, 'role', v)}
                  placeholder="Role"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                />
                <TextInput
                  value={leader.name}
                  onChangeText={(v) => updateLeader(i, 'name', v)}
                  placeholder="Name"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                />
              </View>
              <TouchableOpacity onPress={() => removeLeader(i)} style={styles.removeBtn}>
                <IconSymbol name="minus.circle.fill" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.accent }]}
            onPress={addLeader}
          >
            <IconSymbol name="plus" size={16} color={colors.accent} />
            <ThemedText style={[styles.addBtnText, { color: colors.accent }]}>Add Leader</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 6, width: 36, alignItems: 'center' },
  headerTitle: { fontSize: 17 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 12 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leaderFields: { flex: 1, gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  removeBtn: { padding: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  addBtnText: { fontSize: 15, fontWeight: '600' },
});

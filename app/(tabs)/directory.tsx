import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type Household } from "@/constants/directory";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDirectory } from "@/hooks/use-directory";
import { adminSession } from "@/lib/admin-session";

const CATEGORY_GROUPS = [
  "St. Matthew",
  "St. Mark",
  "St. Luke",
  "St. John",
  "St. Paul",
  "St. Joseph",
  "St. Peter",
] as const;

// Distinct accent colors per group for visual differentiation
const GROUP_COLORS: Record<string, string> = {
  "St. Matthew": "#6366F1",
  "St. Mark":    "#10B981",
  "St. Luke":    "#F59E0B",
  "St. John":    "#3B82F6",
  "St. Paul":    "#EF4444",
  "St. Joseph":  "#8B5CF6",
  "St. Peter":   "#14B8A6",
  "N/A":         "#94A3B8",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
      <ThemedText style={[styles.avatarText, { color }]}>
        {getInitials(name)}
      </ThemedText>
    </View>
  );
}

function GroupDropdown({
  group,
  households,
  isExpanded,
  onToggle,
  colorScheme,
}: {
  group: string;
  households: Household[];
  isExpanded: boolean;
  onToggle: () => void;
  colorScheme: "light" | "dark";
}) {
  const groupColor = GROUP_COLORS[group] ?? "#6366F1";
  const cardBg = colorScheme === "dark" ? Colors.dark.card : Colors.light.card;
  const borderColor = colorScheme === "dark" ? Colors.dark.border : Colors.light.border;

  if (households.length === 0) return null;

  return (
    <View style={[styles.groupDropdown, { backgroundColor: cardBg, borderColor }]}>
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <IconSymbol name="person.2.fill" size={16} color={groupColor} />
        <ThemedText type="defaultSemiBold" style={styles.groupHeaderText}>
          {group}
        </ThemedText>
        <View style={[styles.countPill, { backgroundColor: groupColor + "20" }]}>
          <ThemedText style={[styles.countPillText, { color: groupColor }]}>
            {households.length}
          </ThemedText>
        </View>
        <View style={[styles.chevronCircle, { backgroundColor: groupColor + "15" }]}>
          <IconSymbol
            name="chevron.right"
            size={13}
            color={groupColor}
            style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.groupContent}>
          <View style={[styles.groupDivider, { backgroundColor: groupColor + "30" }]} />
          {households.map((household) => (
            <HouseholdCard key={household.id} household={household} groupColor={groupColor} />
          ))}
        </View>
      )}
    </View>
  );
}

function HouseholdCard({
  household,
  groupColor,
}: {
  household: Household;
  groupColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const accent = colorScheme === "dark" ? Colors.dark.accent : Colors.light.accent;
  const iconColor = colorScheme === "dark" ? Colors.dark.muted : Colors.light.muted;
  const surfaceBg = colorScheme === "dark" ? Colors.dark.surface : Colors.light.surface;

  const fullAddress = [household.address, household.city, household.state]
    .filter(Boolean)
    .join(", ");

  const handlePhonePress = () => {
    const num = household.phone.replace(/\D/g, "");
    if (num) Linking.openURL(`tel:${num}`);
  };

  const handleEmailPress = () => {
    if (household.email) Linking.openURL(`mailto:${household.email}`);
  };

  const handleAddressPress = () => {
    const query = encodeURIComponent(fullAddress);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      style={[styles.card, { backgroundColor: surfaceBg }]}
    >
      <View style={styles.cardHeader}>
        <Avatar name={household.householdName} color={groupColor} />
        <View style={styles.householdInfo}>
          <ThemedText type="defaultSemiBold" style={styles.householdName}>
            {household.householdName}
          </ThemedText>
          <ThemedText style={styles.memberCount}>
            {household.members.length} member{household.members.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>
        <IconSymbol
          name="chevron.right"
          size={16}
          color={iconColor}
          style={[styles.chevron, { transform: [{ rotate: expanded ? "90deg" : "0deg" }] }]}
        />
      </View>

      {expanded && (
        <View style={styles.cardContent}>
          {/* Members */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="person.2.fill" size={14} color={accent} />
              <ThemedText style={[styles.sectionLabel, { color: accent }]}>Members</ThemedText>
            </View>
            {household.members.map((member, idx) => (
              <View key={idx} style={styles.memberRow}>
                <View style={[styles.memberDot, { backgroundColor: groupColor }]} />
                <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                {member.role && (
                  <ThemedText style={styles.memberRole}>{member.role}</ThemedText>
                )}
              </View>
            ))}
          </View>

          {/* Contact rows */}
          {fullAddress && (
            <TouchableOpacity onPress={handleAddressPress} style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: accent + "15" }]}>
                <IconSymbol name="mappin" size={14} color={accent} />
              </View>
              <ThemedText style={styles.contactText}>{fullAddress}</ThemedText>
            </TouchableOpacity>
          )}
          {household.phone && (
            <TouchableOpacity onPress={handlePhonePress} style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: accent + "15" }]}>
                <IconSymbol name="phone.fill" size={14} color={accent} />
              </View>
              <ThemedText style={styles.contactText}>
                {[household.phone, household.phoneAlt].filter(Boolean).join(" · ")}
              </ThemedText>
            </TouchableOpacity>
          )}
          {household.email && (
            <TouchableOpacity onPress={handleEmailPress} style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: accent + "15" }]}>
                <IconSymbol name="envelope.fill" size={14} color={accent} />
              </View>
              <ThemedText style={[styles.contactText, { color: accent }]}>
                {household.email}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DirectoryScreen() {
  const { households, leaders, status } = useDirectory();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries([...CATEGORY_GROUPS, "N/A"].map((g) => [g, false])),
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // Auto-expand all groups when search becomes active; allow toggling after that
  const wasSearching = useRef(false);
  useEffect(() => {
    const isSearching = searchQuery.trim().length > 0;
    if (isSearching && !wasSearching.current) {
      setExpandedGroups(
        Object.fromEntries([...CATEGORY_GROUPS, "N/A"].map((g) => [g, true])),
      );
    }
    wasSearching.current = isSearching;
  }, [searchQuery]);

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const accent = colors.accent;
  const searchBg = colorScheme === "dark" ? "#1E293B" : "#F1F5F9";
  const borderColor = colorScheme === "dark" ? Colors.dark.border : Colors.light.border;

  const filteredHouseholds = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return households;

    const q = query.toLowerCase();
    const qDigits = query.replace(/\D/g, "");

    return households.filter((h) => {
      if (h.householdName?.toLowerCase().includes(q)) return true;
      if (h.members?.some((m) => m.name?.toLowerCase().includes(q))) return true;
      if (h.address?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q)) return true;
      if (qDigits.length >= 2) {
        const p = (h.phone || "").replace(/\D/g, "");
        const pa = (h.phoneAlt || "").replace(/\D/g, "");
        if (p.includes(qDigits) || pa.includes(qDigits)) return true;
      }
      if (h.phone?.includes(query) || h.phoneAlt?.includes(query)) return true;
      if (h.group?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [searchQuery, households]);

  const hasSearch = searchQuery.trim().length > 0;
  const totalFound = filteredHouseholds.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image
            source={require("@/assets/images/catholic.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerTextBlock}>
            <ThemedText type="title" style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              Zomi Catholic Community
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
              Parish Directory · {households.length} households{status === 'loading' ? ' …' : ''}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/admin")}
          >
            <IconSymbol name="lock.fill" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrapper, { backgroundColor: searchBg }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search name, address, or phone…"
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {hasSearch && (
          <View style={[styles.resultsBadge, { backgroundColor: accent }]}>
            <ThemedText style={styles.resultsBadgeText}>{totalFound}</ThemedText>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Community Leaders */}
        {leaders.length > 0 && !hasSearch && (
          <View style={[styles.leadersCard, { backgroundColor: accent + "10", borderColor: accent + "25" }]}>
            <View style={styles.leadersTitleRow}>
              <IconSymbol name="person.fill" size={14} color={accent} />
              <ThemedText type="defaultSemiBold" style={[styles.leadersTitle, { color: accent }]}>
                Community Leaders
              </ThemedText>
            </View>
            {leaders.map((leader, idx) => (
              <View key={idx} style={[styles.leaderRow, idx < leaders.length - 1 && styles.leaderRowBorder, { borderColor }]}>
                <ThemedText style={[styles.leaderRole, { color: colors.muted }]}>{leader.role}</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.leaderName}>{leader.name}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {hasSearch && totalFound === 0 ? (
          <ThemedView style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
              <IconSymbol name="magnifyingglass" size={32} color={colors.muted} />
            </View>
            <ThemedText style={styles.emptyText}>No results found</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.muted }]}>
              Try a different name, address, or phone number
            </ThemedText>
          </ThemedView>
        ) : (
          [...CATEGORY_GROUPS, "N/A"].map((group) => {
            const groupHouseholds = filteredHouseholds.filter((h) => h.group === group);
            if (groupHouseholds.length === 0) return null;
            const shouldExpand = expandedGroups[group] ?? false;
            return (
              <GroupDropdown
                key={group}
                group={group}
                households={groupHouseholds}
                isExpanded={shouldExpand}
                onToggle={() => toggleGroup(group)}
                colorScheme={colorScheme}
              />
            );
          })
        )}
      </ScrollView>

      {/* Footer — long-press to open admin */}
      <TouchableOpacity
        style={[styles.footer, { borderColor }]}
        onLongPress={() => { adminSession.logout(); router.push("/admin"); }}
        delayLongPress={800}
        activeOpacity={1}
      >
        <ThemedText style={[styles.footerText, { color: '#000000' }]}>
          Developed by Noel Muang
        </ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  adminBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Search
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    outlineWidth: 0,
    outlineStyle: 'none',
  },
  resultsBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  resultsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },

  // Leaders card
  leadersCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 4,
  },
  leadersTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  leadersTitle: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  leaderRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leaderRole: {
    fontSize: 13,
    minWidth: 150,
  },
  leaderName: {
    fontSize: 15,
    flex: 1,
  },

  // Group dropdown
  groupDropdown: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  groupHeaderText: {
    flex: 1,
    fontSize: 16,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    minWidth: 28,
    alignItems: "center",
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  groupDivider: {
    height: 1,
    marginHorizontal: 18,
  },
  groupContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  // Household card
  card: {
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  householdInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 15,
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  chevron: {
    opacity: 0.5,
  },

  // Card expanded content
  cardContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
    gap: 6,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  memberName: {
    fontSize: 14,
    flex: 1,
  },
  memberRole: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
  },

  // Contact rows
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  contactIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
    backgroundColor: "transparent",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
});

import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import type { BusinessPlatform } from '@manzil/shared';
import { colors, photoTone, radius, shadow, spacing } from '../theme';

export function Screen({
  children,
  scroll = true,
  contentStyle
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  if (!scroll) {
    return <View style={[styles.screen, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function Title({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return <Text style={[styles.title, compact && styles.titleCompact]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function SectionHeader({
  title,
  kicker,
  action
}: {
  title: string;
  kicker?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        {kicker ? <Kicker>{kicker}</Kicker> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && onPress ? styles.pressed : null
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
    >
      <Text style={[styles.chipText, selected && styles.chipSelectedText]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'primary'
}: {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'gold' | 'quiet';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'gold' && styles.buttonGold,
        tone === 'quiet' && styles.buttonQuiet,
        pressed && onPress ? styles.pressed : null
      ]}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.buttonText,
          tone === 'gold' && styles.buttonGoldText,
          tone === 'quiet' && styles.buttonQuietText
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  editable = true,
  onPress
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.searchField} accessibilityRole={onPress ? 'button' : undefined}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        style={styles.searchInput}
        returnKeyType="search"
        editable={editable}
        pointerEvents={onPress ? 'none' : 'auto'}
        accessibilityLabel={placeholder}
      />
      {value ? <Text style={styles.searchTrailing}>↵</Text> : <Text style={styles.searchHint}>Izlash</Text>}
    </Pressable>
  );
}

export function PhotoBlock({ business, tall = false }: { business: BusinessPlatform; tall?: boolean }) {
  const tone = photoTone(business.photo);
  return (
    <View style={[styles.photoBlock, tall && styles.photoBlockTall, { backgroundColor: tone.bg }]}>
      <View style={styles.photoTopline}>
        <Text style={[styles.photoMark, { color: tone.fg }]}>{tone.mark}</Text>
        <Text style={[styles.photoType, { color: tone.fg }]}>MANZIL PLACE</Text>
      </View>
      <Text style={[styles.photoLabel, { color: tone.fg }]}>{business.district}</Text>
    </View>
  );
}

export function RatingLine({ business }: { business: BusinessPlatform }) {
  return (
    <View style={styles.ratingLine}>
      <Text style={styles.star}>★</Text>
      <Text style={styles.ratingText}>{business.avgRating.toFixed(1)} ({business.reviewCount})</Text>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.metaText}>{business.priceTier}</Text>
      {business.liveStatus?.label.uz ? <><Text style={styles.dot}>•</Text><Text style={styles.metaText}>{business.liveStatus.label.uz}</Text></> : null}
    </View>
  );
}

export function BusinessCard({
  business,
  onPress,
  saved,
  onSave
}: {
  business: BusinessPlatform;
  onPress?: () => void;
  saved?: boolean;
  onSave?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.businessCard, pressed && onPress ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel={`${business.name}, ${business.district}`}
    >
      <PhotoBlock business={business} />
      <View style={styles.businessBody}>
        <View style={styles.businessTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.businessDistrict} numberOfLines={2}>{business.district} · {business.description.uz}</Text>
          </View>
          <Pressable
            onPress={onSave}
            style={styles.saveButton}
            accessibilityRole="button"
            accessibilityLabel={saved ? `${business.name}: saqlangan` : `${business.name}: saqlash`}
            accessibilityState={{ selected: saved }}
          >
            <Text style={styles.saveButtonText}>{saved ? '★' : '☆'}</Text>
          </Pressable>
        </View>
        <RatingLine business={business} />
        <View style={styles.badgeRow}>
          {business.badges?.slice(0, 3).map((badge) => (
            <Chip key={badge.slug} label={`${badge.emoji} ${badge.label.uz}`} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <Card style={styles.emptyState}>
      <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>⌕</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Body style={{ textAlign: 'center' }}>{body}</Body>
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 116 },
  kicker: { color: colors.primary, fontSize: 12, letterSpacing: 0.8, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -0.6, marginTop: spacing.xs },
  titleCompact: { fontSize: 27, lineHeight: 33 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '900', marginTop: 3 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  chip: { minHeight: 38, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 9, backgroundColor: colors.surfaceSoft, justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.inkSoft, fontWeight: '800', fontSize: 13 },
  chipSelectedText: { color: colors.surface },
  button: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  buttonGold: { backgroundColor: colors.gold },
  buttonQuiet: { backgroundColor: colors.surfaceSoft },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
  buttonGoldText: { color: '#5C4300' },
  buttonQuietText: { color: colors.primary },
  searchField: { minHeight: 58, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchIcon: { color: colors.primary, fontSize: 25, fontWeight: '900' },
  searchInput: { flex: 1, color: colors.ink, fontSize: 16, minHeight: 48 },
  searchHint: { color: colors.subtle, fontSize: 12, fontWeight: '800' },
  searchTrailing: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  photoBlock: { height: 126, borderRadius: radius.md, padding: spacing.md, justifyContent: 'space-between', overflow: 'hidden' },
  photoBlockTall: { height: 232, borderRadius: 0 },
  photoTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoMark: { fontSize: 42, fontWeight: '900', opacity: 0.82 },
  photoType: { fontSize: 10, letterSpacing: 1.4, fontWeight: '900', opacity: 0.7 },
  photoLabel: { fontSize: 13, fontWeight: '900', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.78)', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
  ratingLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  star: { color: colors.gold, fontWeight: '900', fontSize: 15 },
  ratingText: { color: colors.ink, fontWeight: '900', fontSize: 14 },
  dot: { color: colors.subtle, fontWeight: '900' },
  metaText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  businessCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.md, ...shadow.card },
  businessBody: { padding: spacing.sm, paddingBottom: 2 },
  businessTitleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  businessName: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  businessDistrict: { color: colors.muted, lineHeight: 20, marginTop: 3 },
  saveButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  statPill: { flex: 1, minWidth: 92, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, padding: spacing.md },
  statValue: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyMark: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyMarkText: { color: colors.primary, fontSize: 26, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontSize: 19, lineHeight: 25, textAlign: 'center', fontWeight: '900', marginBottom: spacing.xs },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] }
});

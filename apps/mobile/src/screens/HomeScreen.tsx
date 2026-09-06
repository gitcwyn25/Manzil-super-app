import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getOccasions, getPlatformBusinesses, getUiCopy } from '@manzil/shared';
import { useAppState } from '../app-state';
import { Body, BusinessCard, Card, Chip, Kicker, PrimaryButton, Screen, SearchField, SectionHeader, Title } from '../components/mobile-ui';
import { colors, locale, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const copy = getUiCopy(locale);
  const occasions = getOccasions();
  const businesses = getPlatformBusinesses();
  const { isSaved, toggleSaved } = useAppState();
  const heroBusiness = businesses[0];
  const nearby = useMemo(() => businesses.slice(1, 4), [businesses]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Kicker>Manzil · Toshkent</Kicker>
          <Text style={{ color: colors.muted, marginTop: 3, fontWeight: '700' }}>Mahalliy tanlovlar, aniqroq qarorlar</Text>
        </View>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.surface, fontWeight: '900', fontSize: 18 }}>M</Text>
        </View>
      </View>

      <Title>{copy.mobile.homeTitle}</Title>
      <Body style={{ marginTop: spacing.xs }}>{copy.mobile.homeSubtitle}</Body>

      <View style={{ marginTop: spacing.lg }}>
        <SearchField
          value=""
          onChangeText={() => undefined}
          placeholder={copy.mobile.searchPlaceholder}
          editable={false}
          onPress={() => navigation.navigate('Search')}
        />
      </View>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.primary, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.primarySoft, fontSize: 12, letterSpacing: 0.7, fontWeight: '900' }}>BUGUNGI TANLOV</Text>
          <Text style={{ color: colors.gold, fontSize: 20 }}>✦</Text>
        </View>
        <Text style={{ color: colors.surface, fontSize: 25, lineHeight: 31, fontWeight: '900', marginTop: spacing.sm }}>
          {heroBusiness.name}
        </Text>
        <Text style={{ color: '#D9EFEB', lineHeight: 21, marginTop: spacing.xs }} numberOfLines={3}>
          {heroBusiness.insight?.aiSummary.uz ?? heroBusiness.description.uz}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: spacing.sm }}>
            <Text style={{ color: colors.gold, fontSize: 18, fontWeight: '900' }}>{heroBusiness.avgRating.toFixed(1)}</Text>
            <Text style={{ color: '#D9EFEB', fontSize: 11, fontWeight: '700' }}>reyting</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.md, padding: spacing.sm }}>
            <Text style={{ color: colors.surface, fontSize: 18, fontWeight: '900' }}>{heroBusiness.priceTier}</Text>
            <Text style={{ color: '#D9EFEB', fontSize: 11, fontWeight: '700' }}>narx darajasi</Text>
          </View>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <PrimaryButton label="Batafsil ko'rish" tone="gold" onPress={() => navigation.navigate('BusinessDetail', { slug: heroBusiness.slug })} />
        </View>
      </Card>

      <SectionHeader title="Bugun rejangiz nima?" kicker="Tezkor yo'nalish" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {occasions.slice(0, 6).map((occasion) => (
          <Chip key={occasion.slug} label={`${occasion.emoji} ${occasion.name[locale]}`} onPress={() => navigation.navigate('Search')} />
        ))}
      </ScrollView>

      <SectionHeader
        title="Yaqin atrofdagi tanlovlar"
        kicker="Katalogdan"
        action={<Pressable onPress={() => navigation.navigate('Search')} accessibilityRole="button"><Text style={{ color: colors.primary, fontWeight: '900' }}>Barchasi</Text></Pressable>}
      />
      {nearby.map((business) => (
        <BusinessCard
          key={business.slug}
          business={business}
          saved={isSaved(business.slug)}
          onSave={() => toggleSaved(business.slug)}
          onPress={() => navigation.navigate('BusinessDetail', { slug: business.slug })}
        />
      ))}

      <Card style={{ marginTop: spacing.sm, backgroundColor: colors.surfaceSoft }}>
        <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 12, letterSpacing: 0.7 }}>GURMAN YORDAMCHI</Text>
        <Text style={{ color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: '900', marginTop: spacing.xs }}>Aniq nima kerakligini bilmayapsizmi?</Text>
        <Body style={{ marginTop: spacing.xs }}>Byudjet, muhit yoki voqeani ayting — katalogdan boshlaymiz.</Body>
        <View style={{ marginTop: spacing.md }}><PrimaryButton label="Gurmandan so'rash" onPress={() => navigation.navigate('Concierge')} /></View>
      </Card>
    </Screen>
  );
}

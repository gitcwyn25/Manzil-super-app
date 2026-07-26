import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getFeedItems,
  getOccasions,
  getPlatformBusinesses,
  getSocialActivities,
  getUiCopy
} from '@manzil/shared';
import { useAppState } from '../app-state';
import {
  Body,
  BusinessCard,
  Card,
  Chip,
  Kicker,
  PrimaryButton,
  Screen,
  SectionHeader,
  StatPill,
  Title
} from '../components/mobile-ui';
import { colors, locale, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const copy = getUiCopy(locale);
  const feedItems = getFeedItems();
  const occasions = getOccasions();
  const businesses = getPlatformBusinesses();
  const activities = getSocialActivities();
  const businessBySlug = useMemo(() => new Map(businesses.map((business) => [business.slug, business])), [businesses]);
  const { isSaved, toggleSaved } = useAppState();

  const heroBusiness = businesses[0];

  return (
    <Screen>
      <Kicker>{copy.brand.tagline} · {copy.brand.city}</Kicker>
      <Title>{copy.mobile.homeTitle}</Title>
      <Body style={{ marginTop: spacing.xs }}>{copy.mobile.homeSubtitle}</Body>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.primary }}>
        <Text style={{ color: colors.primarySoft, fontWeight: '900', fontSize: 13 }}>Bugun eng ishonchli tanlov</Text>
        <Text style={{ color: colors.surface, fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 6 }}>
          {heroBusiness.name}
        </Text>
        <Text style={{ color: '#D8ECE8', lineHeight: 21, marginTop: 6 }}>
          {heroBusiness.insight?.aiSummary.uz}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
          <StatPill value={heroBusiness.avgRating.toFixed(1)} label="reyting" />
          <StatPill value={heroBusiness.liveStatus?.waitMinutes ?? 0} label="daq. kutish" />
          <StatPill value={heroBusiness.insight?.trendingRank ? `#${heroBusiness.insight.trendingRank}` : 'Top'} label="trend" />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <PrimaryButton label="Batafsil ko'rish" tone="gold" onPress={() => navigation.navigate('BusinessDetail', { slug: heroBusiness.slug })} />
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {occasions.map((occasion) => (
            <Chip key={occasion.slug} label={`${occasion.emoji} ${occasion.name[locale]}`} />
          ))}
        </View>
      </ScrollView>

      <SectionHeader title="Sizga yaqin g'oyalar" kicker="Kashfiyot feed" />
      {feedItems.slice(0, 4).map((item) => (
        <Card key={item.id} style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '900' }}>
            {item.emoji} {item.title[locale]}
          </Text>
          {item.subtitle ? <Body style={{ marginTop: 4 }}>{item.subtitle[locale]}</Body> : null}
          <View style={{ marginTop: spacing.md }}>
            {item.businessSlugs.map((slug) => {
              const business = businessBySlug.get(slug);
              if (!business) return null;
              return (
                <BusinessCard
                  key={slug}
                  business={business}
                  saved={isSaved(slug)}
                  onSave={() => toggleSaved(slug)}
                  onPress={() => navigation.navigate('BusinessDetail', { slug })}
                />
              );
            })}
          </View>
        </Card>
      ))}

      <SectionHeader title={copy.mobile.friendActivity} kicker="Jamiyat" />
      {activities.map((activity) => (
        <Card key={activity.id} style={{ marginBottom: spacing.sm }}>
          <Text style={{ color: colors.ink, fontWeight: '900' }}>
            {activity.actorName} {activity.action[locale]}
          </Text>
          <Text style={{ color: colors.primary, fontWeight: '900', marginTop: 4 }}>
            {businessBySlug.get(activity.businessSlug)?.name}
          </Text>
        </Card>
      ))}

      <PrimaryButton label={copy.mobile.continueDiscover} onPress={() => navigation.navigate('Search')} />
    </Screen>
  );
}

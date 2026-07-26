import React, { useMemo } from 'react';
import { Linking, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlatformBusiness, getUiCopy } from '@manzil/shared';
import { useAppState } from '../app-state';
import {
  Body,
  Card,
  Chip,
  EmptyState,
  PhotoBlock,
  PrimaryButton,
  RatingLine,
  Screen,
  SectionHeader,
  StatPill,
  Title
} from '../components/mobile-ui';
import { colors, locale, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'BusinessDetail'>;

export default function BusinessDetailScreen({ route, navigation }: Props) {
  const copy = getUiCopy(locale);
  const data = getPlatformBusiness(route.params.slug);
  const { isSaved, toggleSaved, submittedReviews } = useAppState();

  const reviews = useMemo(() => {
    if (!data) return [];
    return [...submittedReviews.filter((review) => review.businessSlug === data.business.slug), ...data.reviews];
  }, [data, submittedReviews]);

  if (!data) {
    return (
      <Screen>
        <EmptyState title="Joy topilmadi" body="Bu listing mavjud emas yoki o'chirilgan." />
      </Screen>
    );
  }

  const { business } = data;
  const saved = isSaved(business.slug);

  function openDirections() {
    const query = encodeURIComponent(`${business.name}, ${business.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => undefined);
  }

  function callBusiness() {
    if (!business.phone) return;
    Linking.openURL(`tel:${business.phone}`).catch(() => undefined);
  }

  return (
    <Screen contentStyle={{ paddingTop: 0 }}>
      <View style={{ marginHorizontal: -spacing.lg }}>
        <PhotoBlock business={business} tall />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Title compact>{business.name}</Title>
            <Body style={{ marginTop: 4 }}>{business.description[locale]}</Body>
          </View>
          <Chip label={business.status === 'claimed' ? copy.business.verified : copy.business.unclaimed} selected={business.status === 'claimed'} />
        </View>
        <RatingLine business={business} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
        <StatPill value={business.liveStatus?.waitMinutes ?? 0} label="daq. kutish" />
        <StatPill value={business.socialProof?.friendsVisited ?? 0} label={copy.business.friendsVisited} />
        <StatPill value={business.insight?.monthlyViews ?? 0} label={copy.business.viewsPerMonth} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
        <PrimaryButton label={business.phone ? "Qo'ng'iroq" : "Telefon yo'q"} tone="quiet" onPress={callBusiness} />
        <PrimaryButton label="Yo'nalish" tone="quiet" onPress={openDirections} />
        <PrimaryButton label={saved ? copy.actions.saved : copy.actions.save} tone={saved ? 'gold' : 'primary'} onPress={() => toggleSaved(business.slug)} />
      </View>

      <Card style={{ marginTop: spacing.lg, backgroundColor: '#E9F6F3' }}>
        <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{copy.business.aiSummaryKicker}</Text>
        <Text style={{ color: colors.ink, lineHeight: 23, fontSize: 16, marginTop: 6 }}>
          {business.insight?.aiSummary[locale] ?? business.description[locale]}
        </Text>
      </Card>

      <SectionHeader title="Amaliy ma'lumot" />
      <Card>
        <Fact label={copy.business.addressLabel} value={business.address} />
        <Fact label={copy.business.hoursLabel} value={business.hours} />
        <Fact label={copy.business.phoneLabel} value={business.phone ?? 'Mavjud emas'} />
      </Card>

      <SectionHeader title={copy.business.qualityNote} kicker={copy.business.qualityKicker} />
      <Card>
        {business.qualityScore ? (
          Object.entries({
            [copy.business.qualityMetrics.reviewQuality]: business.qualityScore.reviewQuality,
            [copy.business.qualityMetrics.freshness]: business.qualityScore.freshness,
            [copy.business.qualityMetrics.popularity]: business.qualityScore.popularity,
            [copy.business.qualityMetrics.returnVisitors]: business.qualityScore.returnVisitors
          }).map(([label, value]) => <ScoreRow key={label} label={label} value={value} />)
        ) : (
          <Body>Hali yetarli signal yo'q.</Body>
        )}
      </Card>

      <SectionHeader
        title={copy.business.reviewsTitle}
        kicker={copy.business.reviewsKicker}
        action={<PrimaryButton label="Sharh" tone="quiet" onPress={() => navigation.navigate('Review', { slug: business.slug })} />}
      />
      {reviews.length ? (
        reviews.map((review) => (
          <Card key={review.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontWeight: '900' }}>{review.authorName}</Text>
                {review.authorBadge ? <Body>{review.authorBadge}</Body> : null}
              </View>
              <Text style={{ color: colors.gold, fontWeight: '900' }}>★ {review.rating}</Text>
            </View>
            <Text style={{ color: colors.ink, lineHeight: 22, marginTop: spacing.sm }}>{review.text}</Text>
            <Text style={{ color: colors.subtle, marginTop: spacing.sm, fontWeight: '700' }}>
              {review.helpfulCount} {copy.reviewsList.helpful}
            </Text>
          </Card>
        ))
      ) : (
        <EmptyState title={copy.reviewsList.emptyTitle} body={copy.reviewsList.emptyBody} />
      )}
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#E8E8E6' }}>
      <Text style={{ color: colors.subtle, fontWeight: '800', marginBottom: 2 }}>{label}</Text>
      <Text style={{ color: colors.ink, lineHeight: 21, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: colors.ink, fontWeight: '800' }}>{label}</Text>
        <Text style={{ color: colors.primary, fontWeight: '900' }}>{value}</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceHigh, overflow: 'hidden' }}>
        <View style={{ width: `${value}%`, height: 8, backgroundColor: colors.primary }} />
      </View>
    </View>
  );
}

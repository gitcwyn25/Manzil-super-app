import React from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getAchievements,
  getDiscoverableUsers,
  getPlatformBusinesses,
  getSocialActivities,
  getUiCopy,
  getUserProfile
} from '@manzil/shared';
import { useAppState } from '../app-state';
import { Body, Card, Chip, Kicker, Screen, SectionHeader, StatPill, Title } from '../components/mobile-ui';
import { colors, locale, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const copy = getUiCopy(locale);
  const profile = getUserProfile();
  const achievements = getAchievements();
  const users = getDiscoverableUsers();
  const activities = getSocialActivities();
  const businesses = getPlatformBusinesses();
  const { savedSlugs } = useAppState();
  const businessBySlug = new Map(businesses.map((business) => [business.slug, business]));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text style={{ fontSize: 30, fontWeight: '900', color: colors.primary }}>
            {profile.displayName.charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Kicker>@{profile.handle}</Kicker>
          <Title compact>{profile.displayName}</Title>
          <Body>{profile.bio[locale]}</Body>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
        <StatPill value={profile.stats.reviews} label={copy.profile.reviews} />
        <StatPill value={savedSlugs.length} label={copy.profile.saved} />
        <StatPill value={profile.stats.photos} label={copy.profile.photos} />
      </View>

      <SectionHeader title={copy.profile.achievementsTitle} kicker={copy.profile.achievementsKicker} />
      {achievements.map((achievement) => {
        const earned = profile.earnedAchievementSlugs.includes(achievement.slug);
        return (
          <Card key={achievement.slug} style={{ marginBottom: spacing.sm, opacity: earned ? 1 : 0.68 }}>
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Text style={{ fontSize: 26 }}>{achievement.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900' }}>{achievement.name[locale]}</Text>
                <Body>{achievement.description[locale]}</Body>
              </View>
              <Chip label={earned ? copy.profile.earned : copy.profile.locked} selected={earned} />
            </View>
          </Card>
        );
      })}

      <SectionHeader title={copy.profile.followingTitle} kicker={copy.profile.followingKicker} />
      {users.slice(0, 2).map((user) => (
        <Card key={user.id} style={{ marginBottom: spacing.sm }}>
          <Text style={{ color: colors.ink, fontWeight: '900', fontSize: 17 }}>{user.displayName}</Text>
          <Body>{user.bio[locale]}</Body>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Chip label={`${user.followerCount} ${copy.profile.followers}`} />
            <Chip label={user.topCategory[locale]} />
          </View>
        </Card>
      ))}

      <SectionHeader title={copy.profile.activityTitle} kicker={copy.profile.activityKicker} />
      {activities.map((activity) => (
        <Card key={activity.id} style={{ marginBottom: spacing.sm, borderRadius: radius.md }}>
          <Text style={{ color: colors.ink, fontWeight: '900' }}>{activity.actorName}</Text>
          <Body>{activity.action[locale]}</Body>
          <Text
            style={{ color: colors.primary, fontWeight: '900', marginTop: 4 }}
            onPress={() => navigation.navigate('BusinessDetail', { slug: activity.businessSlug })}
          >
            {businessBySlug.get(activity.businessSlug)?.name}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

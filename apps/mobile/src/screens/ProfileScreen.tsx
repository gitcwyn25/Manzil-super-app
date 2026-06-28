import { ScrollView, Text, View } from 'react-native';
import {
  getAchievements,
  getDiscoverableUsers,
  getPlatformBusinesses,
  getUserProfile,
  getUiCopy
} from '@manzil/shared';

const locale = 'uz' as const;

export default function ProfileScreen() {
  const copy = getUiCopy(locale);
  const profile = getUserProfile();
  const achievements = getAchievements();
  const users = getDiscoverableUsers();
  const businesses = getPlatformBusinesses();
  const saved = businesses.filter((business) => profile.defaultSavedSlugs.includes(business.slug));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f7' }}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#a1f0ef',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#005454' }}>
              {profile.displayName.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>{profile.displayName}</Text>
            <Text style={{ color: '#3e4948' }}>@{profile.handle}</Text>
            <Text style={{ color: '#3e4948', marginTop: 6 }}>{profile.bio[locale]}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <Text>{profile.stats.reviews} {copy.profile.reviews}</Text>
          <Text>{profile.stats.saved} {copy.profile.saved}</Text>
          <Text>{profile.stats.followers} {copy.profile.followers}</Text>
        </View>

        <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 12 }}>{copy.mobile.achievements}</Text>
        {achievements.map((achievement) => {
          const earned = profile.earnedAchievementSlugs.includes(achievement.slug);
          return (
            <View
              key={achievement.slug}
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                opacity: earned ? 1 : 0.65
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800' }}>
                {achievement.emoji} {achievement.name[locale]}
              </Text>
              <Text style={{ color: '#3e4948', marginTop: 4 }}>{achievement.description[locale]}</Text>
            </View>
          );
        })}

        <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 12 }}>
          {copy.mobile.savedPlaces}
        </Text>
        {saved.map((business) => (
          <View key={business.slug} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 }}>
            <Text style={{ fontWeight: '800' }}>{business.name}</Text>
            <Text style={{ color: '#3e4948' }}>{business.district}</Text>
          </View>
        ))}

        <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 12 }}>
          {copy.mobile.followingPeople}
        </Text>
        {users.slice(0, 2).map((user) => (
          <View key={user.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 }}>
            <Text style={{ fontWeight: '800' }}>{user.displayName}</Text>
            <Text style={{ color: '#3e4948' }}>{user.bio[locale]}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  getFeedItems,
  getOccasions,
  getPlatformBusinesses,
  getSocialActivities,
  getUiCopy
} from '@manzil/shared';

const locale = 'uz' as const;

export default function HomeScreen() {
  const copy = getUiCopy(locale);
  const feedItems = getFeedItems();
  const occasions = getOccasions();
  const businesses = getPlatformBusinesses();
  const activities = getSocialActivities();
  const businessBySlug = new Map(businesses.map((business) => [business.slug, business]));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f7' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#005454', fontSize: 14, fontWeight: '700' }}>
          {copy.brand.tagline} · {copy.brand.city}
        </Text>
        <Text style={{ fontSize: 32, fontWeight: '800', marginTop: 8, color: '#1a1c1b' }}>
          {copy.mobile.homeTitle}
        </Text>
        <Text style={{ color: '#3e4948', marginTop: 8, lineHeight: 22 }}>
          {copy.mobile.homeSubtitle}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 24 }}>
          {occasions.map((occasion) => (
            <View
              key={occasion.slug}
              style={{
                backgroundColor: '#f4f4f2',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginRight: 10
              }}
            >
              <Text style={{ fontWeight: '700' }}>
                {occasion.emoji} {occasion.name[locale]}
              </Text>
            </View>
          ))}
        </ScrollView>

        {feedItems.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 18,
              marginTop: 18,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '800' }}>
              {item.emoji} {item.title[locale]}
            </Text>
            {item.subtitle ? (
              <Text style={{ color: '#3e4948', marginTop: 6 }}>{item.subtitle[locale]}</Text>
            ) : null}
            {item.businessSlugs.map((slug) => {
              const business = businessBySlug.get(slug);
              if (!business) return null;
              return (
                <View
                  key={slug}
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: '#f9f9f7'
                  }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 16 }}>{business.name}</Text>
                  <Text style={{ color: '#3e4948', marginTop: 4 }}>
                    {business.avgRating} ★ · {business.district}
                  </Text>
                  {business.badges?.slice(0, 2).map((badge) => (
                    <Text key={badge.slug} style={{ marginTop: 6 }}>
                      {badge.emoji} {badge.label[locale]}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        ))}

        <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 28, marginBottom: 12 }}>
          {copy.mobile.friendActivity}
        </Text>
        {activities.map((activity) => (
          <View
            key={activity.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 10
            }}
          >
            <Text style={{ fontWeight: '700' }}>
              {activity.actorName} {activity.action[locale]}
            </Text>
            <Text style={{ color: '#005454', marginTop: 4 }}>
              {businessBySlug.get(activity.businessSlug)?.name}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: '#feb300',
            borderRadius: 12,
            padding: 16,
            marginTop: 24,
            marginBottom: 40
          }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '800', color: '#6a4800' }}>
            {copy.mobile.continueDiscover}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

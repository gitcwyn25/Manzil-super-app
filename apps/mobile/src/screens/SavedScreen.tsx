import React from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlatformBusinesses, getUiCopy } from '@manzil/shared';
import { useAppState } from '../app-state';
import { BusinessCard, EmptyState, Kicker, PrimaryButton, Screen, Title } from '../components/mobile-ui';
import { locale, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Saved'>;

export default function SavedScreen({ navigation }: Props) {
  const copy = getUiCopy(locale);
  const businesses = getPlatformBusinesses();
  const { savedSlugs, isSaved, toggleSaved } = useAppState();
  const saved = businesses.filter((business) => savedSlugs.includes(business.slug));

  return (
    <Screen>
      <Kicker>{copy.profile.savedKicker}</Kicker>
      <Title compact>{copy.profile.savedTitle}</Title>
      <Text style={{ marginTop: spacing.xs, color: '#3E4948', lineHeight: 22 }}>
        Saqlangan joylar sayohat, tushlik va hafta oxiri rejalarini tezroq qilish uchun.
      </Text>

      <View style={{ marginTop: spacing.lg }}>
        {saved.length ? (
          saved.map((business) => (
            <BusinessCard
              key={business.slug}
              business={business}
              saved={isSaved(business.slug)}
              onSave={() => toggleSaved(business.slug)}
              onPress={() => navigation.navigate('BusinessDetail', { slug: business.slug })}
            />
          ))
        ) : (
          <EmptyState
            title={copy.profile.savedEmptyTitle}
            body={copy.profile.savedEmptyBody}
            action={<PrimaryButton label="Kashfiyotga o'tish" onPress={() => navigation.navigate('Search')} />}
          />
        )}
      </View>
    </Screen>
  );
}

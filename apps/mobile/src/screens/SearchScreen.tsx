import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlatformBusinesses, getUiCopy, searchPlatformBusinesses } from '@manzil/shared';
import { useAppState } from '../app-state';
import {
  Body,
  BusinessCard,
  Chip,
  EmptyState,
  Kicker,
  PrimaryButton,
  Screen,
  SearchField,
  Title
} from '../components/mobile-ui';
import { colors, locale, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Search'>;

const filters = [
  { id: 'all', label: 'Hammasi' },
  { id: 'restaurants', label: 'Restoran' },
  { id: 'cafes', label: 'Kafe' },
  { id: 'beauty', label: "Go'zallik" }
];

export default function SearchScreen({ navigation }: Props) {
  const copy = getUiCopy(locale);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const { isSaved, toggleSaved } = useAppState();
  const allBusinesses = useMemo(() => getPlatformBusinesses(), []);
  const results = useMemo(() => searchPlatformBusinesses(query, category), [category, query]);

  return (
    <Screen scroll={false} contentStyle={{ paddingTop: spacing.lg }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Kicker>{copy.search.kicker}</Kicker>
        <Title compact>{copy.mobile.searchTitle}</Title>
        <Body style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>{copy.search.subtitle}</Body>
        <SearchField value={query} onChangeText={setQuery} placeholder={copy.mobile.searchPlaceholder} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              selected={category === filter.id}
              onPress={() => setCategory(filter.id)}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg }}>
          <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900' }}>{copy.search.results(results.length)}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Chip label={copy.search.listView} selected={mode === 'list'} onPress={() => setMode('list')} />
            <Chip label={copy.search.mapView} selected={mode === 'map'} onPress={() => setMode('map')} />
          </View>
        </View>
      </View>

      {mode === 'map' ? (
        <View style={{ padding: spacing.lg }}>
          <View
            style={{
              height: 260,
              borderRadius: 16,
              backgroundColor: '#D8ECE8',
              padding: spacing.lg,
              justifyContent: 'space-between'
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 44, fontWeight: '900' }}>⌖</Text>
            <View>
              <Text style={{ color: colors.ink, fontSize: 20, fontWeight: '900' }}>Toshkent xaritasi</Text>
              <Body>{results.length} joy topildi. Haqiqiy map provider keyingi bosqichda ulanadi.</Body>
            </View>
          </View>
          {results.slice(0, 2).map((business) => (
            <BusinessCard
              key={business.slug}
              business={business}
              saved={isSaved(business.slug)}
              onSave={() => toggleSaved(business.slug)}
              onPress={() => navigation.navigate('BusinessDetail', { slug: business.slug })}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 112 }}
          ListEmptyComponent={
            <EmptyState
              title={copy.search.emptyTitle}
              body={copy.search.emptyBody}
              action={<PrimaryButton label="Trend joylarni ko'rish" onPress={() => setQuery('')} />}
            />
          }
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              saved={isSaved(item.slug)}
              onSave={() => toggleSaved(item.slug)}
              onPress={() => navigation.navigate('BusinessDetail', { slug: item.slug })}
            />
          )}
          ListFooterComponent={
            allBusinesses.length > results.length ? null : (
              <Text style={{ color: colors.subtle, textAlign: 'center', marginTop: spacing.md }}>
                Barcha mos joylar ko'rsatildi.
              </Text>
            )
          }
        />
      )}
    </Screen>
  );
}

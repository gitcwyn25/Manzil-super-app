import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { getPlatformBusinesses, getUiCopy, searchPlatformBusinesses } from '@manzil/shared';

const locale = 'uz' as const;

export default function SearchScreen() {
  const copy = getUiCopy(locale);
  const businesses = useMemo(() => getPlatformBusinesses(), []);
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => searchPlatformBusinesses(query, 'all'),
    [query]
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f7' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#005454', fontWeight: '700' }}>{copy.search.kicker}</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', marginTop: 8, marginBottom: 16 }}>
          {copy.mobile.searchTitle}
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={copy.mobile.searchPlaceholder}
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 16
          }}
        />

        <Text style={{ fontWeight: '700', marginBottom: 12 }}>{copy.search.results(results.length)}</Text>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={{ color: '#3e4948' }}>{copy.search.emptyTitle}</Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#fff',
                padding: 16,
                borderRadius: 16,
                marginBottom: 12
              }}
            >
              <Text style={{ fontWeight: '800', fontSize: 18 }}>{item.name}</Text>
              <Text style={{ color: '#3e4948', marginTop: 4 }}>
                {item.district} · {item.description[locale]}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: '#feb300' }}>★</Text>
                <Text style={{ marginLeft: 6, fontWeight: '700' }}>
                  {item.avgRating} ({item.reviewCount})
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

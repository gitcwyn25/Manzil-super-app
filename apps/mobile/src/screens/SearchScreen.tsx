import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useTranslations } from '@/i18n';
import { useState, useEffect } from 'react';

export default function SearchScreen() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations('search');

  const fetchResults = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from API
      setResults([
        {
          id: '1',
          name: 'Restaurant A',
          category: 'Restaurant',
          rating: 4.5,
          reviews: 128,
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">{t('results')}</Text>
        {loading ? (
          <Text>{t('loading')}</Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity className="bg-white p-4 rounded-lg mb-3">
                <Text className="font-bold text-lg">{item.name}</Text>
                <Text className="text-gray-600 text-sm mb-2">
                  {item.category}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-yellow-400">★</Text>
                  <Text className="ml-2 font-medium">
                    {item.rating} ({item.reviews})
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

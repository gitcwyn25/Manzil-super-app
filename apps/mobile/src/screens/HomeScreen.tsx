import { useTranslations } from '@/i18n';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const t = useTranslations('home');

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-3xl font-bold mb-2 text-gray-900">
          {t('title')}
        </Text>
        <Text className="text-base text-gray-600 mb-6">{t('subtitle')}</Text>

        {/* Search Bar */}
        <View className="mb-6">
          <TextInput
            placeholder={t('search_placeholder')}
            value={search}
            onChangeText={setSearch}
            className="bg-gray-100 p-3 rounded-lg text-base"
          />
        </View>

        {/* Categories */}
        <Text className="text-xl font-bold mb-4 text-gray-900">
          {t('categories')}
        </Text>
        <View className="grid grid-cols-2 gap-4 mb-6">
          {[
            { name: 'Restaurants', emoji: '🍽️' },
            { name: 'Cafes', emoji: '☕' },
            { name: 'Beauty', emoji: '💇' },
            { name: 'Healthcare', emoji: '⚕️' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.name}
              className="bg-gray-50 p-4 rounded-lg items-center"
            >
              <Text className="text-3xl mb-2">{cat.emoji}</Text>
              <Text className="text-sm font-medium">{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

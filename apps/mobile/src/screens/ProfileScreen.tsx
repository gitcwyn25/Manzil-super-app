import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTranslations } from '@/i18n';
import { useState } from 'react';

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations('profile');

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* User Info */}
        <View className="mb-6 items-center">
          <View className="w-20 h-20 bg-gray-300 rounded-full mb-4" />
          <Text className="text-2xl font-bold">{t('username')}</Text>
          <Text className="text-gray-600">{t('member_since')}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around mb-6 bg-gray-50 p-4 rounded-lg">
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">5</Text>
            <Text className="text-gray-600">{t('reviews')}</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">2</Text>
            <Text className="text-gray-600">{t('saved')}</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">1</Text>
            <Text className="text-gray-600">{t('photos')}</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity className="bg-blue-600 p-4 rounded-lg mb-3">
          <Text className="text-white font-bold text-center">
            {t('my_reviews')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-gray-200 p-4 rounded-lg mb-3">
          <Text className="text-gray-900 font-bold text-center">
            {t('saved_places')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-gray-200 p-4 rounded-lg">
          <Text className="text-gray-900 font-bold text-center">
            {t('settings')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlatformBusiness, getUiCopy } from '@manzil/shared';
import { useAppState } from '../app-state';
import { Body, Card, Chip, EmptyState, PrimaryButton, Screen, Title } from '../components/mobile-ui';
import { colors, locale, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Review'>;

const reviewTags = ['Mazali', 'Toza', 'Tez xizmat', 'Oilaviy', 'Sokin', 'Qimmat'];

export default function ReviewScreen({ route, navigation }: Props) {
  const copy = getUiCopy(locale);
  const data = getPlatformBusiness(route.params.slug);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { submitReview } = useAppState();

  if (!data) {
    return (
      <Screen>
        <EmptyState title="Joy topilmadi" body="Sharh yozish uchun listing mavjud emas." />
      </Screen>
    );
  }

  function toggleTag(tag: string) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function submit() {
    if (!data) return;

    submitReview({
      businessSlug: data.business.slug,
      rating,
      text: text.trim() || `${data.business.name} haqida foydali tajriba.`,
      tags
    });
    navigation.goBack();
  }

  return (
    <Screen>
      <Title compact>{copy.business.writeTitle}</Title>
      <Body style={{ marginTop: spacing.xs }}>{data.business.name} uchun qisqa, foydali sharh qoldiring.</Body>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: spacing.sm }}>Reyting</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Chip
              key={item}
              label="★"
              selected={item <= rating}
              onPress={() => setRating(item)}
            />
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: spacing.sm }}>
          Nima ajralib turdi?
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {reviewTags.map((tag) => (
            <Chip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: spacing.sm }}>
          Tajribangiz
        </Text>
        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          placeholder="Masalan: ish vaqti to'g'ri, xizmat tez, narx mos..."
          placeholderTextColor={colors.subtle}
          style={{
            minHeight: 150,
            textAlignVertical: 'top',
            color: colors.ink,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceSoft,
            padding: spacing.md,
            lineHeight: 22
          }}
        />
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton label="Sharhni yuborish" onPress={submit} />
      </View>
    </Screen>
  );
}

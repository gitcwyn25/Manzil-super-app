import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getConciergePrompts,
  getConciergeReply,
  getPlatformBusinesses,
  getUiCopy
} from '@manzil/shared';
import { Body, Card, Chip, Kicker, PrimaryButton, Screen, Title } from '../components/mobile-ui';
import { colors, locale, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Concierge'>;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: { slug: string; name: string; reason: string }[];
};

export default function ConciergeScreen({ navigation }: Props) {
  const copy = getUiCopy(locale);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: copy.concierge.welcome
    }
  ]);

  const businesses = getPlatformBusinesses();
  const businessBySlug = useMemo(
    () => new Map(businesses.map((business) => [business.slug, business])),
    [businesses]
  );
  const prompts = getConciergePrompts();

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const reply = getConciergeReply(trimmed);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text: trimmed },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: reply.text[locale],
        suggestions: reply.suggestions.map((item) => ({
          slug: item.businessSlug,
          name: businessBySlug.get(item.businessSlug)?.name ?? item.businessSlug,
          reason: item.reason[locale]
        }))
      }
    ]);
    setInput('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Kicker>{copy.concierge.kicker}</Kicker>
        <Title compact>{copy.concierge.title}</Title>
        <Body style={{ marginTop: spacing.xs }}>{copy.concierge.subtitle}</Body>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {prompts.map((prompt) => (
              <Chip key={prompt[locale]} label={prompt[locale]} onPress={() => sendMessage(prompt[locale])} />
            ))}
          </View>
        </ScrollView>

        <View style={{ marginTop: spacing.lg }}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.role === 'user' ? colors.primary : colors.surface,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginBottom: spacing.sm,
                maxWidth: '88%'
              }}
            >
              <Text style={{ color: message.role === 'user' ? colors.surface : colors.ink, lineHeight: 21 }}>
                {message.text}
              </Text>
              {message.suggestions?.map((suggestion) => (
                <Card key={suggestion.slug} style={{ marginTop: spacing.sm, padding: spacing.sm }}>
                  <Text style={{ color: colors.ink, fontWeight: '900' }}>{suggestion.name}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800', marginTop: 3 }}>{suggestion.reason}</Text>
                  <View style={{ marginTop: spacing.sm }}>
                    <PrimaryButton
                      label="Joyni ochish"
                      tone="quiet"
                      onPress={() => navigation.navigate('BusinessDetail', { slug: suggestion.slug })}
                    />
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={copy.concierge.placeholder}
            placeholderTextColor={colors.subtle}
            style={{
              flex: 1,
              minHeight: 50,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.outline,
              paddingHorizontal: spacing.md,
              color: colors.ink
            }}
          />
          <PrimaryButton label={copy.concierge.send} onPress={() => sendMessage(input)} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

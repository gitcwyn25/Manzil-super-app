import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  getConciergePrompts,
  getConciergeReply,
  getPlatformBusinesses,
  getUiCopy
} from '@manzil/shared';

const locale = 'uz' as const;

export default function ConciergeScreen() {
  const copy = getUiCopy(locale);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant' as const,
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
      { id: `user-${Date.now()}`, role: 'user' as const, text: trimmed },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
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
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f7' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#005454', fontWeight: '700' }}>{copy.concierge.kicker}</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', marginTop: 8 }}>{copy.concierge.title}</Text>

        {messages.map((message) => (
          <View
            key={message.id}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: message.role === 'user' ? '#005454' : '#fff',
              padding: 14,
              borderRadius: 16,
              marginTop: 12,
              maxWidth: '85%'
            }}
          >
            <Text style={{ color: message.role === 'user' ? '#fff' : '#1a1c1b' }}>{message.text}</Text>
            {'suggestions' in message && message.suggestions
              ? message.suggestions.map((suggestion) => (
                  <Text key={suggestion.slug} style={{ marginTop: 8, color: '#005454', fontWeight: '700' }}>
                    {suggestion.name} · {suggestion.reason}
                  </Text>
                ))
              : null}
          </View>
        ))}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
          {prompts.map((prompt) => (
            <TouchableOpacity
              key={prompt[locale]}
              onPress={() => sendMessage(prompt[locale])}
              style={{
                backgroundColor: '#f4f4f2',
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginRight: 8
              }}
            >
              <Text>{prompt[locale]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 40 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={copy.concierge.placeholder}
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12
            }}
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            style={{ backgroundColor: '#005454', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>{copy.concierge.send}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

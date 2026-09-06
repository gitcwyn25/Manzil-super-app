import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

type Props = { onComplete: () => void; onGuest: () => void };

type Intent = 'Birthday' | 'Weekend' | 'Haircut' | 'Dinner' | 'Coffee' | 'Travel' | 'Wedding' | 'Family';
const intents: Intent[] = ['Birthday', 'Weekend', 'Haircut', 'Dinner', 'Coffee', 'Travel', 'Wedding', 'Family'];
const suggestions = ['Plan a birthday', 'Book a barber', 'Find dinner', 'Weekend trip', 'Best coffee nearby'];
const preferences = [
  { label: 'Budget range', values: ['$', '$$', '$$$'] },
  { label: 'Favorite cuisines', values: ['Milliy', 'Osiyo', 'Yevropa'] },
  { label: 'Travel distance', values: ['Yaqin', 'Shahar', 'Istalgan joy'] },
  { label: 'Indoor / outdoor', values: ['Ichkarida', 'Tashqarida', 'Farqi yo\'q'] },
  { label: 'Luxury / casual', values: ['Premium', 'Oddiy', 'Aralash'] },
  { label: 'Family-friendly', values: ['Ha', 'Farqi yo\'q'] },
  { label: 'Pet-friendly', values: ['Ha', 'Farqi yo\'q'] },
  { label: 'Accessibility needs', values: ['Kerak', 'Kerak emas'] }
];

export default function OnboardingFlow({ onComplete, onGuest }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Toshkent');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [intent, setIntent] = useState<Intent>('Weekend');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [preferenceValues, setPreferenceValues] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  const progress = useMemo(() => Math.min(1, Math.max(0, (step - 5) / 5)), [step]);

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), 1900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [step]);

  useEffect(() => {
    if (step === 10) {
      const timer = setTimeout(() => onComplete(), 2100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [onComplete, step]);

  function next() {
    setStep((current) => Math.min(10, current + 1));
  }

  function back() {
    setStep((current) => Math.max(1, current - 1));
  }

  function choosePreference(label: string, value: string) {
    setPreferenceValues((current) => ({ ...current, [label]: value }));
  }

  if (step === 0) {
    return (
      <SafeAreaView style={styles.splash}>
        <Pressable style={styles.splashCenter} onPress={() => setStep(1)} accessibilityRole="button" accessibilityLabel="Manzilni davom ettirish">
          <View style={styles.compass}><View style={styles.compassNeedle} /></View>
          <Text style={styles.wordmark}>MANZIL</Text>
          <Text style={styles.splashCaption}>GURMAN AI</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { paddingTop: Math.max(insets.top * 0.15, 8) }]}>
          <View style={styles.topbar}>
            {step > 1 && step < 10 ? (
              <Pressable onPress={back} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Orqaga"><Text style={styles.backText}>‹</Text></Pressable>
            ) : <View style={styles.backPlaceholder} />}
            {step >= 5 && step <= 9 ? <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(12, progress * 100)}%` }]} /></View> : <View style={{ flex: 1 }} />}
            <Text style={styles.stepLabel}>{step >= 5 && step <= 9 ? `${step - 4}/4` : 'MANZIL'}</Text>
          </View>

          {step === 1 ? <Welcome onNext={next} /> : null}
          {step === 2 ? <SignIn onPhone={() => setStep(3)} onGuest={onGuest} /> : null}
          {step === 3 ? <Register name={name} contact={contact} setName={setName} setContact={setContact} onNext={next} /> : null}
          {step === 4 ? <Otp value={otp} setValue={(value) => { setOtp(value); if (value.length >= 6) setStep(5); }} onNext={next} /> : null}
          {step === 5 ? <Permissions onNext={next} /> : null}
          {step === 6 ? <IntentStep value={intent} onChange={setIntent} onNext={next} /> : null}
          {step === 7 ? <AiIntro selected={selectedSuggestion} onSelect={(value) => { setSelectedSuggestion(value); setStep(8); }} /> : null}
          {step === 8 ? <ProfileStep name={name} city={city} setName={setName} setCity={setCity} onNext={next} /> : null}
          {step === 9 ? <Personalization values={preferenceValues} onSelect={choosePreference} onNext={next} /> : null}
          {step === 10 ? <Ready onTap={onComplete} /> : null}

          {step === 1 || step === 2 || step === 3 || step === 4 || step === 5 || step === 6 || step === 7 || step === 8 || step === 9 ? null : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.screenBody}>
      <View>
        <Text style={styles.eyebrow}>Toshkentdan boshlaymiz</Text>
        <Text style={styles.hero}>Discover.{"\n"}Plan.{"\n"}Experience.</Text>
        <Text style={styles.subtitle}>Mahalliy joylarni toping, rejani tuzing va vaqtni yaxshi o'tkazing.</Text>
      </View>
      <View style={styles.pillars}>
        <Pillar index="01" title="Discover" body="Ishonchli mahalliy joylarni toping" />
        <Pillar index="02" title="Plan" body="Gurman bilan rejangizni tuzing" />
        <Pillar index="03" title="Experience" body="Borib ko'ring va foydali sharh qoldiring" />
      </View>
      <View style={styles.bottomActions}>
        <Primary label="Boshlash" onPress={onNext} />
        <TextButton label="Kirish" onPress={onNext} />
      </View>
    </View>
  );
}

function Pillar({ index, title, body }: { index: string; title: string; body: string }) {
  return <View style={styles.pillar}><Text style={styles.pillarIndex}>{index}</Text><View style={{ flex: 1 }}><Text style={styles.pillarTitle}>{title}</Text><Text style={styles.pillarBody}>{body}</Text></View></View>;
}

function SignIn({ onPhone, onGuest }: { onPhone: () => void; onGuest: () => void }) {
  const methods = [
    ['Apple bilan davom etish', onPhone],
    ['Google bilan davom etish', onPhone],
    ['Telegram bilan davom etish', onPhone],
    ['Telefon bilan davom etish', onPhone],
    ['Email bilan davom etish', onPhone]
  ] as const;
  return (
    <View style={styles.screenBody}>
      <View><Text style={styles.eyebrow}>Manzilga qaytish</Text><Text style={styles.title}>Rejalaringiz siz bilan qolsin.</Text><Text style={styles.subtitle}>Kirish saqlangan joylar, rejalar va shaxsiy tavsiyalarni bir joyda ushlab turadi.</Text></View>
      <View style={styles.authList}>{methods.map(([label, action]) => <Pressable key={label} onPress={action} style={styles.authButton} accessibilityRole="button"><View style={styles.authIcon}><Text style={styles.authIconText}>{label.charAt(0)}</Text></View><Text style={styles.authLabel}>{label}</Text><Text style={styles.chevron}>›</Text></Pressable>)}
        <Pressable onPress={onGuest} style={[styles.authButton, styles.guestButton]} accessibilityRole="button"><View style={styles.authIcon}><Text style={styles.authIconText}>○</Text></View><Text style={styles.authLabel}>Mehmon sifatida davom etish</Text><Text style={styles.chevron}>›</Text></Pressable>
      </View>
      <Text style={styles.note}>Mehmonlar katalogni ko'rishi mumkin. Saqlash va Gurman rejalari uchun bepul hisob yarating.</Text>
      <TextButton label="Yangi hisob yaratish" onPress={onPhone} />
    </View>
  );
}

function Register({ name, contact, setName, setContact, onNext }: { name: string; contact: string; setName: (v: string) => void; setContact: (v: string) => void; onNext: () => void }) {
  return <View style={styles.screenBody}><View><Text style={styles.eyebrow}>Yangi hisob</Text><Text style={styles.title}>Faqat kerakli ma'lumotlar.</Text><Text style={styles.subtitle}>Bir necha soniyada boshlang. Keyin profilingizni xohlaganingizcha to'ldirasiz.</Text></View><View style={styles.form}><Field label="Ism" value={name} onChangeText={setName} placeholder="Ismingiz" /><Field label="Telefon yoki email" value={contact} onChangeText={setContact} placeholder="+998 yoki email" keyboardType="email-address" /></View><Text style={styles.note}>Tasdiqlash kodi shu manzilga yuboriladi.</Text><View style={styles.bottomActions}><Primary label="Davom etish" onPress={onNext} disabled={!name.trim() || !contact.trim()} /></View></View>;
}

function Otp({ value, setValue, onNext }: { value: string; setValue: (v: string) => void; onNext: () => void }) {
  return <View style={styles.screenBody}><View><Text style={styles.eyebrow}>Tasdiqlash</Text><Text style={styles.title}>Kodni kiriting.</Text><Text style={styles.subtitle}>Demo APK uchun istalgan 6 ta raqamni kiriting. Haqiqiy SMS tasdiqlash backend ulanganda ishlaydi.</Text></View><TextInput value={value} onChangeText={(text) => setValue(text.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} autoFocus style={styles.otpInput} placeholder="000000" placeholderTextColor={colors.subtle} accessibilityLabel="Tasdiqlash kodi" /><Text style={styles.note}>Kod 6 raqamdan iborat.</Text><View style={styles.bottomActions}><Primary label="Tasdiqlash" onPress={onNext} disabled={value.length < 6} /></View></View>;
}

function Permissions({ onNext }: { onNext: () => void }) {
  const rows = [['⌖', 'Joylashuv', 'Yaqin atrofdagi tajribalarni tavsiya qilish uchun.'], ['◌', 'Bildirishnomalar', 'Bronlarni eslatish uchun.'], ['▧', 'Galereya', 'Xotiralarni yuklash uchun.'], ['◉', 'Mikrofon · ixtiyoriy', 'Gurman bilan tabiiy gaplashish uchun.']];
  return <View style={styles.screenBody}><View><Text style={styles.eyebrow}>Sizning nazoratingizda</Text><Text style={styles.title}>Ruxsatlar faqat kerak bo'lganda.</Text><Text style={styles.subtitle}>Manzil har bir so'rovning qiymatini oldindan tushuntiradi. Hozircha hech qanday tizim oynasi ochilmaydi.</Text></View><View style={styles.infoList}>{rows.map(([icon, title, body]) => <View key={title} style={styles.infoRow}><View style={styles.infoIcon}><Text style={styles.infoIconText}>{icon}</Text></View><View style={{ flex: 1 }}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View></View>)}</View><View style={styles.bottomActions}><Primary label="Davom etish" onPress={onNext} /></View></View>;
}

function IntentStep({ value, onChange, onNext }: { value: Intent; onChange: (v: Intent) => void; onNext: () => void }) {
  return <View style={styles.screenBody}><View><Text style={styles.eyebrow}>Bugungi reja</Text><Text style={styles.title}>Gurman sizni tushunsin.</Text><Text style={styles.subtitle}>Bugun nimani rejalashtiryapsiz?</Text></View><View style={styles.optionList}>{intents.map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[styles.option, value === item && styles.optionSelected]} accessibilityRole="radio" accessibilityState={{ selected: value === item }}><View style={[styles.radio, value === item && styles.radioSelected]}>{value === item ? <View style={styles.radioDot} /> : null}</View><Text style={[styles.optionText, value === item && styles.optionTextSelected]}>{item}</Text></Pressable>)}</View><View style={styles.bottomActions}><Primary label="Davom etish" onPress={onNext} /></View></View>;
}

function AiIntro({ selected, onSelect }: { selected: string | null; onSelect: (value: string) => void }) {
  return <View style={styles.screenBody}><View><View style={styles.aiStatus}><View style={styles.statusDot} /><Text style={styles.aiStatusText}>GURMAN AI · TAYYOR</Text></View><Text style={styles.aiBubble}>Nimani rejalashtirayotganingizni ayting. Qolganini men hal qilaman.</Text><Text style={styles.subtitle}>Boshlash uchun bittasini tanlang.</Text></View><View style={styles.suggestionGrid}>{suggestions.map((item) => <Pressable key={item} onPress={() => onSelect(item)} style={[styles.suggestion, selected === item && styles.suggestionSelected]} accessibilityRole="button"><Text style={[styles.suggestionText, selected === item && styles.suggestionTextSelected]}>{item}</Text><Text style={styles.suggestionArrow}>↗</Text></Pressable>)}</View><Text style={styles.note}>Gurman tanlovingizni bilib, keyingi qadamni moslashtiradi.</Text></View>;
}

function ProfileStep({ name, city, setName, setCity, onNext }: { name: string; city: string; setName: (v: string) => void; setCity: (v: string) => void; onNext: () => void }) {
  return <View style={styles.screenBody}><View><Text style={styles.eyebrow}>Siz haqingizda</Text><Text style={styles.title}>Gurman sizni tanisin.</Text><Text style={styles.subtitle}>Ism va shahar yetarli. Surat keyinroq ham qo'shiladi.</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{name.trim() ? name.trim().charAt(0).toUpperCase() : '+'}</Text></View><View style={styles.form}><Field label="Ko'rinadigan ism" value={name} onChangeText={setName} placeholder="Ismingiz" /><Field label="Shahar" value={city} onChangeText={setCity} placeholder="Toshkent" /></View><View style={styles.bottomActions}><Primary label="Tugatish" onPress={onNext} /><TextButton label="Hozircha o'tkazib yuborish" onPress={onNext} /></View></View>;
}

function Personalization({ values, onSelect, onNext }: { values: Record<string, string>; onSelect: (label: string, value: string) => void; onNext: () => void }) {
  return <View style={styles.screenBody}><View><View style={styles.aiStatus}><View style={styles.statusDot} /><Text style={styles.aiStatusText}>GURMAN AI</Text></View><Text style={styles.title}>Sizga mosroq tavsiyalar.</Text><Text style={styles.subtitle}>Hammasi ixtiyoriy. Keyinroq Profil bo'limida o'zgartirasiz.</Text></View><ScrollView style={styles.preferenceScroll} showsVerticalScrollIndicator={false}>{preferences.map((item) => <View key={item.label} style={styles.preferenceRow}><Text style={styles.preferenceLabel}>{item.label}</Text><View style={styles.preferenceValues}>{item.values.map((value) => <Pressable key={value} onPress={() => onSelect(item.label, value)} style={[styles.preferenceChip, values[item.label] === value && styles.preferenceChipSelected]} accessibilityRole="radio" accessibilityState={{ selected: values[item.label] === value }}><Text style={[styles.preferenceText, values[item.label] === value && styles.preferenceTextSelected]}>{value}</Text></Pressable>)}</View></View>)}</ScrollView><View style={styles.bottomActions}><Primary label="Davom etish" onPress={onNext} /></View></View>;
}

function Ready({ onTap }: { onTap: () => void }) {
  return <Pressable style={styles.ready} onPress={onTap} accessibilityRole="button" accessibilityLabel="Tayyor, birinchi tajribani rejalashtirishni boshlash"><View style={styles.successMark}><Text style={styles.successText}>✓</Text></View><Text style={styles.readyTitle}>Tayyorsiz.</Text><Text style={styles.readyBody}>Birinchi tajribangizni rejalashtiramiz.</Text><Text style={styles.readyHint}>Davom etish uchun bosing</Text></Pressable>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string; keyboardType?: 'default' | 'email-address' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.subtle} keyboardType={keyboardType} style={styles.fieldInput} accessibilityLabel={label} /></View>;
}

function Primary({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primary, disabled && styles.disabled, pressed && !disabled && styles.pressed]} accessibilityRole="button"><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.textButton} accessibilityRole="button"><Text style={styles.textButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  splash: { flex: 1, backgroundColor: colors.primaryDark },
  splashCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  compass: { width: 108, height: 108, borderRadius: 54, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  compassNeedle: { width: 3, height: 62, backgroundColor: colors.gold, transform: [{ rotate: '38deg' }] },
  wordmark: { color: colors.surface, fontSize: 25, letterSpacing: 5, fontWeight: '900' },
  splashCaption: { color: colors.gold, letterSpacing: 3, fontSize: 11, fontWeight: '900', marginTop: spacing.sm },
  container: { flex: 1, paddingHorizontal: spacing.lg },
  topbar: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backPlaceholder: { width: 42 },
  backText: { color: colors.primary, fontSize: 30, lineHeight: 30, marginTop: -4 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.primary },
  stepLabel: { color: colors.subtle, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, minWidth: 44, textAlign: 'right' },
  screenBody: { flex: 1, paddingTop: spacing.xl, paddingBottom: spacing.md },
  eyebrow: { color: colors.primary, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '900' },
  hero: { color: colors.ink, fontSize: 42, lineHeight: 44, letterSpacing: -1.1, fontWeight: '900', marginTop: spacing.md },
  title: { color: colors.ink, fontSize: 31, lineHeight: 37, letterSpacing: -0.7, fontWeight: '900', marginTop: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: spacing.sm },
  pillars: { gap: spacing.sm, marginTop: spacing.xl },
  pillar: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, ...{ shadowColor: colors.primaryDark, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 } },
  pillarIndex: { color: colors.gold, fontSize: 12, fontWeight: '900', marginTop: 2 },
  pillarTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  pillarBody: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  bottomActions: { marginTop: 'auto', gap: spacing.sm },
  primary: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  textButtonText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  authList: { gap: spacing.sm, marginTop: spacing.xl },
  authButton: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  guestButton: { backgroundColor: colors.surfaceSoft, borderColor: colors.surfaceSoft },
  authIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  authIconText: { color: colors.primary, fontWeight: '900' },
  authLabel: { flex: 1, color: colors.ink, fontWeight: '800', fontSize: 14 },
  chevron: { color: colors.primary, fontSize: 24 },
  note: { color: colors.subtle, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.xl },
  field: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingTop: 8 },
  fieldLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  fieldInput: { minHeight: 40, color: colors.ink, fontSize: 16, paddingVertical: 3 },
  otpInput: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, color: colors.ink, fontSize: 30, letterSpacing: 9, textAlign: 'center', minHeight: 72, marginTop: spacing.xl, paddingLeft: 8 },
  infoList: { gap: spacing.lg, marginTop: spacing.xl },
  infoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  infoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoIconText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  infoTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  infoBody: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  optionList: { gap: spacing.sm, marginTop: spacing.xl },
  option: { minHeight: 48, borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  optionTextSelected: { color: colors.surface },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.surface },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surface },
  aiStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  aiStatusText: { color: colors.primary, fontSize: 11, letterSpacing: 1, fontWeight: '900' },
  aiBubble: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: '900', marginTop: spacing.lg },
  suggestionGrid: { gap: spacing.sm, marginTop: spacing.xl },
  suggestion: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center' },
  suggestionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  suggestionText: { flex: 1, color: colors.ink, fontWeight: '800', fontSize: 15 },
  suggestionTextSelected: { color: colors.surface },
  suggestionArrow: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: spacing.xl },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: '900' },
  preferenceScroll: { flex: 1, marginTop: spacing.lg },
  preferenceRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceHigh },
  preferenceLabel: { color: colors.ink, fontSize: 14, fontWeight: '900', marginBottom: spacing.sm },
  preferenceValues: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  preferenceChip: { borderWidth: 1, borderColor: colors.outline, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 8, backgroundColor: colors.surface },
  preferenceChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  preferenceText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  preferenceTextSelected: { color: colors.surface },
  ready: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.xxl },
  successMark: { width: 82, height: 82, borderRadius: 41, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  successText: { color: colors.primary, fontSize: 40, fontWeight: '400' },
  readyTitle: { color: colors.ink, fontSize: 34, fontWeight: '900', marginTop: spacing.xl },
  readyBody: { color: colors.muted, fontSize: 16, marginTop: spacing.xs },
  readyHint: { color: colors.subtle, fontSize: 12, fontWeight: '800', marginTop: spacing.xxl },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] }
});

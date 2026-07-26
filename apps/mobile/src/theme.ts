export const colors = {
  ink: '#1A1C1B',
  muted: '#3E4948',
  subtle: '#6E7979',
  background: '#F9F9F7',
  surface: '#FFFFFF',
  surfaceSoft: '#F4F4F2',
  surfaceHigh: '#E8E8E6',
  outline: '#BEC9C8',
  primary: '#005454',
  primarySoft: '#A1F0EF',
  primaryContainer: '#0F6E6E',
  primaryDark: '#002020',
  gold: '#FEB300',
  goldSoft: '#FFDEAC',
  danger: '#BA1A1A',
  success: '#0F6E4B'
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  }
} as const;

export const locale = 'uz' as const;

export function photoTone(photo: string) {
  switch (photo) {
    case 'coffee':
      return { bg: '#D8ECE8', fg: '#005454', mark: '☕' };
    case 'somsa':
      return { bg: '#FFE6B3', fg: '#6A4800', mark: '△' };
    case 'beauty':
      return { bg: '#FFE1D4', fg: '#823100', mark: '✦' };
    case 'plov':
    default:
      return { bg: '#E2EFE7', fg: '#0F6E4B', mark: '●' };
  }
}

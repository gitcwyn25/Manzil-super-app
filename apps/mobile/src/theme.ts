export const colors = {
  ink: '#102A2A',
  inkSoft: '#274443',
  muted: '#526968',
  subtle: '#738785',
  background: '#F7FAF8',
  surface: '#FFFFFF',
  surfaceSoft: '#ECF4F1',
  surfaceHigh: '#DCEAE5',
  outline: '#B7CBC5',
  primary: '#005454',
  primarySoft: '#C8F3EA',
  primaryContainer: '#0B6B68',
  primaryDark: '#003B3B',
  gold: '#F7B51D',
  goldSoft: '#FFF0C4',
  danger: '#B3261E',
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
  lg: 18,
  xl: 24,
  pill: 999
} as const;

export const shadow = {
  card: {
    shadowColor: '#003B3B',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  }
} as const;

export const locale = 'uz' as const;

export function photoTone(photo: string) {
  switch (photo) {
    case 'coffee':
      return { bg: '#D6EFE8', fg: '#005454', mark: '☕' };
    case 'somsa':
      return { bg: '#FFE8B7', fg: '#795000', mark: '△' };
    case 'beauty':
      return { bg: '#FFE0D6', fg: '#873D32', mark: '✦' };
    case 'plov':
    default:
      return { bg: '#DDEEE2', fg: '#0F6E4B', mark: '●' };
  }
}

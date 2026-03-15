export const COLORS = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0EDE8',
  surfaceDark: '#1C1C1E',
  text: '#1A1A1A',
  textSecondary: '#6B6560',
  textTertiary: '#A8A29E',
  textOnDark: '#FFFFFF',
  primary: '#F97316',
  primaryMuted: 'rgba(249,115,22,0.12)',
  secondary: '#7C6FCD',
  secondaryMuted: 'rgba(124,111,205,0.12)',
  accent: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: 'rgba(0,0,0,0.06)',
  divider: 'rgba(0,0,0,0.04)',
  tabBar: '#1C1C1E',
  cardFlip: '#1C1C1E',
};

export const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  Biology: { bg: 'rgba(34,197,94,0.12)', text: '#16A34A' },
  Chemistry: { bg: 'rgba(239,68,68,0.12)', text: '#DC2626' },
  Physics: { bg: 'rgba(124,111,205,0.15)', text: '#7C6FCD' },
  History: { bg: 'rgba(245,158,11,0.12)', text: '#D97706' },
  Math: { bg: 'rgba(249,115,22,0.12)', text: '#F97316' },
  English: { bg: 'rgba(20,184,166,0.12)', text: '#0D9488' },
  Economics: { bg: 'rgba(249,115,22,0.12)', text: '#EA580C' },
  Psychology: { bg: 'rgba(124,111,205,0.15)', text: '#7C6FCD' },
  default: { bg: 'rgba(249,115,22,0.12)', text: '#F97316' },
};

export function getSubjectColor(subject: string): { bg: string; text: string } {
  return SUBJECT_COLORS[subject] ?? SUBJECT_COLORS.default;
}

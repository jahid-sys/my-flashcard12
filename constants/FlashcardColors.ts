export const COLORS = {
  background: '#F5F7FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1FB',
  text: '#1A1D2E',
  textSecondary: '#5C6080',
  textTertiary: '#9CA3C4',
  primary: '#4F6EF7',
  primaryMuted: 'rgba(79,110,247,0.10)',
  accent: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: 'rgba(79,110,247,0.08)',
  divider: 'rgba(79,110,247,0.05)',
  cardFlip: '#1A1D2E',
};

export const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  Biology: { bg: 'rgba(34,197,94,0.12)', text: '#16A34A' },
  Chemistry: { bg: 'rgba(239,68,68,0.12)', text: '#DC2626' },
  Physics: { bg: 'rgba(79,110,247,0.12)', text: '#4F6EF7' },
  History: { bg: 'rgba(245,158,11,0.12)', text: '#D97706' },
  Math: { bg: 'rgba(168,85,247,0.12)', text: '#9333EA' },
  English: { bg: 'rgba(20,184,166,0.12)', text: '#0D9488' },
  Economics: { bg: 'rgba(249,115,22,0.12)', text: '#EA580C' },
  Psychology: { bg: 'rgba(236,72,153,0.12)', text: '#DB2777' },
  default: { bg: 'rgba(79,110,247,0.10)', text: '#4F6EF7' },
};

export function getSubjectColor(subject: string): { bg: string; text: string } {
  return SUBJECT_COLORS[subject] ?? SUBJECT_COLORS.default;
}

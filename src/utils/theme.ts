/**
 * FinSarathi.AI FinTech Theme Design System
 * Primary: Navy Blue (#0A192F), Crisp White (#FFFFFF), Emerald Green (#10B981), Slate Gray (#64748B)
 */

export const Colors = {
  // Primary FinTech Palette
  primaryNavy: '#0A192F',
  darkBg: '#061121',
  cardBg: '#0E213D',
  cardBgLight: '#142B4E',
  crispWhite: '#FFFFFF',
  emeraldGreen: '#10B981',
  emeraldLight: 'rgba(16, 185, 129, 0.12)',
  slateGray: '#64748B',
  slateLight: '#94A3B8',
  slateSubtle: '#CBD5E1',
  slateBg: '#F1F5F9',
  borderDark: 'rgba(148, 163, 184, 0.14)',
  borderLight: 'rgba(255, 255, 255, 0.08)',

  // FinTech Indicators
  debitRed: '#F43F5E',
  debitLight: 'rgba(244, 63, 94, 0.12)',
  creditGreen: '#10B981',
  amberWarn: '#F59E0B',
  amberLight: 'rgba(245, 158, 11, 0.12)',
  blueAccent: '#38BDF8',
  indigoAccent: '#6366F1',
  purpleAccent: '#A855F7',

  // Category Palette for Spending Donut/Visualizer
  categories: {
    'Food & Dining': '#F59E0B',
    'Groceries': '#10B981',
    'Fuel & Travel': '#38BDF8',
    'Utilities & Bills': '#818CF8',
    'Shopping': '#EC4899',
    'Salary & Income': '#34D399',
    'Transfer': '#94A3B8',
    'Health & Wellness': '#14B8A6',
    'Entertainment': '#A855F7',
    'Other': '#64748B',
  } as Record<string, string>,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
};

const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Typography = {
  ...fontSizes,
  fontSize: fontSizes,
  fontWeight: fontWeights,
};

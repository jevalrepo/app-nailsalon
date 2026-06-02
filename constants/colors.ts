export const ACCENT_COLORS = {
  coral:    '#F4A99A',
  lavender: '#C4B5FD',
  blush:    '#FDA4AF',
  mint:     '#6EE7B7',
  sky:      '#7DD3FC',
  peach:    '#FDBA74',
} as const;

export type AccentColor = keyof typeof ACCENT_COLORS;

export const DEFAULT_ACCENT: AccentColor = 'coral';

export const COLORS = {
  light: {
    background:       '#FFFFFF',
    surface:          '#F8F8F8',
    surfaceElevated:  '#FFFFFF',
    border:           '#EBEBEB',
    borderLight:      '#F2F2F2',
    text:             '#1A1A1A',
    textSecondary:    '#6B6B6B',
    textTertiary:     '#A0A0A0',
    placeholder:      '#C0C0C0',
    destructive:      '#FF453A',
    success:          '#30D158',
    warning:          '#FF9F0A',
  },
  dark: {
    background:       '#000000',
    surface:          '#1C1C1E',
    surfaceElevated:  '#2C2C2E',
    border:           '#3A3A3C',
    borderLight:      '#2C2C2E',
    text:             '#FFFFFF',
    textSecondary:    '#EBEBF5CC',
    textTertiary:     '#EBEBF560',
    placeholder:      '#636366',
    destructive:      '#FF453A',
    success:          '#30D158',
    warning:          '#FF9F0A',
  },
} as const;

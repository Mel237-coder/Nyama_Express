export const Colors = {
  primaryGreen: '#00AA13',
  primaryOrange: '#FF6600',
  primaryYellow: '#FFCC00',
  bg: '#F7F7F7',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#E53935',
  success: '#00AA13',
  warning: '#FFCC00',
  shadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export type ColorKey = keyof typeof Colors;
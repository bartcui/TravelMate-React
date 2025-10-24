// styles/colors.ts
export const palette = {
  white: '#ffffff',
  black: '#000000',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray400: '#999999',
  gray600: '#666666',
  gray800: '#333333',
  primary500: '#0aa770',
};

export type Theme = {
  bg: string; surface: string; text: string; textMuted: string; border: string;
  primary: string; primaryOn: string;
};

export const lightTheme: Theme = {
  bg: palette.white,
  surface: palette.white,
  text: palette.gray800,
  textMuted: palette.gray600,
  border: palette.gray200,
  primary: palette.primary500,
  primaryOn: palette.white,
};

export const darkTheme: Theme = {
  bg: '#0b0b0b',
  surface: '#121212',
  text: palette.gray100,
  textMuted: palette.gray400,
  border: '#1e1e1e',
  primary: palette.primary500,
  primaryOn: palette.white,
};

export const getTheme = (scheme: 'light' | 'dark' | null | undefined) =>
  scheme === 'dark' ? darkTheme : lightTheme;

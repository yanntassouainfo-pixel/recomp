import { useColorScheme } from 'react-native';

export const ACCENT = { body: '#5B5FEF', muscle: '#F06A4D', fat: '#15A39A', vitality: '#38C98E', recovery: '#F0A93B', consistency: '#D4A72C', nutrition: '#7A9B3A' } as const;

export function useTheme() {
  const dark = useColorScheme() === 'dark';
  return {
    dark,
    bg: dark ? '#0E1012' : '#F5F4F0',
    surface: dark ? '#16191D' : '#FFFFFF',
    surface2: dark ? '#1D2126' : '#EFEEE9',
    ink: dark ? '#F2F2EE' : '#121417',
    ink2: dark ? '#A0A6AD' : '#5B6168',
    ink3: dark ? '#6D737A' : '#8A9097',
    line: dark ? '#262B31' : '#E4E2DB',
  };
}

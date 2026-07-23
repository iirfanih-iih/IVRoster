import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../theme/colors';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  cycleTheme: () => void;
  initialize: () => Promise<void>;
}

function resolveColors(mode: ThemeMode): { colors: ThemeColors; isDark: boolean } {
  if (mode === 'dark') return { colors: darkColors, isDark: true };
  if (mode === 'light') return { colors: lightColors, isDark: false };
  const system = Appearance.getColorScheme();
  return system === 'light'
    ? { colors: lightColors, isDark: false }
    : { colors: darkColors, isDark: true };
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  ...resolveColors('system'),

  setMode: (mode: ThemeMode) => {
    const resolved = resolveColors(mode);
    set({ mode, ...resolved });
    AsyncStorage.setItem('iv-theme', mode);
  },

  cycleTheme: () => {
    const current = get().mode;
    const next: ThemeMode =
      current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    get().setMode(next);
  },

  initialize: async () => {
    const stored = await AsyncStorage.getItem('iv-theme');
    if (stored && ['dark', 'light', 'system'].includes(stored)) {
      const mode = stored as ThemeMode;
      const resolved = resolveColors(mode);
      set({ mode, ...resolved });
    }
  },
}));

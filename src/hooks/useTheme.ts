import { useState, useEffect } from 'react';

export type ThemeName = 'midnight' | 'emerald' | 'sunset' | 'lavender';

export const themes: { id: ThemeName; label: string; color: string }[] = [
  { id: 'midnight', label: 'Midnight', color: 'hsl(217 91% 60%)' },
  { id: 'emerald', label: 'Emerald', color: 'hsl(160 84% 39%)' },
  { id: 'sunset', label: 'Sunset', color: 'hsl(25 95% 53%)' },
  { id: 'lavender', label: 'Lavender', color: 'hsl(270 76% 62%)' },
];

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('eos-theme') as ThemeName) || 'midnight';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('eos-theme', theme);
  }, [theme]);

  return { theme, setTheme: setThemeState, themes };
}

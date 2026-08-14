export const C = {
  bg: 'var(--bg)',
  bg2: 'var(--bg2)',
  s1: 'var(--s1)',
  s2: 'var(--s2)',
  br: 'var(--br)',
  t1: 'var(--t1)',
  t2: 'var(--t2)',
  t3: 'var(--t3)',
  t4: 'var(--t4)',
  acc: 'var(--acc)',
  accH: 'var(--acc-hover)',
  accS: 'var(--acc-soft)',
  accB: 'var(--acc-border)',
  gold: 'var(--gold)',
  goldS: 'var(--gold-soft)',
  purple: '#A78BFA',
  blue: '#67A7F0',
  orange: '#F59E6B',
  teal: '#59C7B4',
  amber: '#E6B765',
  indigo: '#7F91F5',
  red: '#EE7777',
  sky: '#72B6D5',
}

export type ThemePreference = 'dark' | 'light' | 'system'

export function applyThemePreference(preference: ThemePreference) {
  const resolved =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : preference
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

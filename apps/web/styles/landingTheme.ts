export const landingTheme = {
  colors: {
    background: 'rgba(6, 11, 25, 1)',
    surface: 'rgba(15, 23, 42, 0.82)',
    surfaceSoft: 'rgba(15, 23, 42, 0.64)',
    surfaceAlt: 'rgba(23, 33, 62, 0.72)',
    foreground: 'rgba(241, 245, 249, 1)',
    muted: 'rgba(148, 163, 184, 1)',
    accentBlue: 'rgba(56, 189, 248, 1)',
    accentPurple: 'rgba(168, 85, 247, 1)',
    accentPink: 'rgba(236, 72, 153, 1)',
    accentGold: 'rgba(251, 191, 36, 1)',
    stroke: 'rgba(148, 163, 184, 0.22)',
    strokeStrong: 'rgba(255, 255, 255, 0.2)',
    success: 'rgba(34, 197, 94, 1)',
    warning: 'rgba(250, 204, 21, 1)',
    danger: 'rgba(248, 113, 113, 1)'
  },
  gradients: {
    hero: 'linear-gradient(135deg, rgba(56, 189, 248, 0.32), rgba(168, 85, 247, 0.28))',
    section: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.1))',
    sectionAlt: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.08))',
    card: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(30, 41, 59, 0.65))',
    accent: 'linear-gradient(135deg, rgba(56, 189, 248, 1), rgba(168, 85, 247, 1))',
    accentHighlight: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(168, 85, 247, 0.85))',
    glow: 'radial-gradient(circle at top center, rgba(56, 189, 248, 0.35), rgba(15, 23, 42, 0))'
  },
  radii: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    pill: '999px'
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    hero: '96px'
  },
  typography: {
    display: {
      xl: 'clamp(3.2rem, 5vw, 4.8rem)',
      l: 'clamp(2.8rem, 4.2vw, 3.6rem)',
      m: 'clamp(2.4rem, 3.2vw, 3rem)'
    },
    heading: {
      xl: 'clamp(2.2rem, 2.8vw, 2.8rem)',
      l: 'clamp(1.9rem, 2.4vw, 2.4rem)',
      m: 'clamp(1.6rem, 2vw, 2rem)',
      s: 'clamp(1.35rem, 1.6vw, 1.6rem)'
    },
    body: {
      l: 'clamp(1.15rem, 1.5vw, 1.25rem)',
      m: '1rem',
      s: '0.92rem'
    },
    eyebrow: '0.8rem',
    subtitle: 'clamp(1.05rem, 1.4vw, 1.2rem)',
    hero: 'clamp(2.6rem, 4vw, 3.6rem)',
    small: '0.9rem'
  },
  motion: {
    easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
    easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
    easeSpring: [0.24, 1, 0.32, 1] as [number, number, number, number],
    durationShort: 0.28,
    duration: 0.48,
    durationSlow: 0.72
  },
  layout: {
    contentWidth: 'min(1120px, 92vw)',
    gridGap: 'minmax(24px, 3vw)',
    sectionGap: 'clamp(72px, 12vw, 128px)'
  }
}

export type LandingTheme = typeof landingTheme

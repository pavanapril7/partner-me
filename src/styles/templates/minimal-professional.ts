import { ThemeConfig } from './types';

/**
 * Minimal Professional Template
 * Design Philosophy: Clean, professional, and trustworthy. Uses subtle colors and ample
 * whitespace to create a sophisticated, business-focused aesthetic.
 * Perfect for professional services and B2B platforms.
 */
export const minimalProfessionalTheme: ThemeConfig = {
  name: 'Minimal Professional',
  description: 'Clean & Trustworthy - Professional design with subtle colors and ample whitespace',
  
  colors: {
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
      DEFAULT: '#1e293b',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
      DEFAULT: '#475569',
    },
    accent: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
      DEFAULT: '#4f46e5',
    },
    neutral: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
      950: '#0c0a09',
      DEFAULT: '#78716c',
    },
    semantic: {
      success: '#22c55e',
      warning: '#f97316',
      error: '#dc2626',
      info: '#4f46e5',
    },
  },

  typography: {
    fontFamily: {
      heading: 'Outfit, Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
    },
    scale: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
  },

  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
    '4xl': '6rem',  // 96px
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.25rem',   // 4px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
    md: '0 2px 4px 0 rgb(0 0 0 / 0.05)',
    lg: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
    xl: '0 8px 12px -2px rgb(0 0 0 / 0.08)',
    '2xl': '0 12px 24px -4px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.03)',
    none: 'none',
  },
};

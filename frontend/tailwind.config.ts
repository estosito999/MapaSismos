import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-app': '#F4F4F5',
        surface: '#FFFFFF',
        border: '#E4E4E7',
        'text-title': '#18181B',
        'text-body': '#27272A',
        'text-muted': '#71717A',
        'brand-primary': '#18181B',
        'brand-hover': '#27272A',
        'brand-accent': '#F97316',
        'accent-hover': '#EA580C',
        'alert-severe': '#E11D48',
        'alert-warning': '#EA580C',
        'alert-info': '#0284C7',
        success: '#059669',
      },
      minHeight: {
        touch: '44px',
      },
      borderRadius: {
        sismo: '8px',
      },
    },
  },
  plugins: [],
};

export default config;

/**
 * @file tailwind.config.ts
 * @description Tailwind CSS configuration with custom color palette
 * @created 2025-11-13
 * @updated 2025-11-13
 * 
 * OVERVIEW:
 * Custom color palette for Business & Politics Simulation MMO
 * - Picton Blue (#00aef3): Primary brand color, CTAs, links, active states
 * - Red CMYK (#e81b23): Error states, warnings, critical actions
 * - Ash Gray (#b2beb5): Neutral UI elements, borders, disabled states
 * - Gold (#ffd700): Highlights, success states, premium features
 * - Night (#141414): Dark backgrounds, primary dark mode
 * - White (#ffffff): Text on dark backgrounds, light mode backgrounds
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand color - Picton Blue
        picton_blue: {
          DEFAULT: '#00aef3',
          100: '#002331',
          200: '#004662',
          300: '#006993',
          400: '#008cc4',
          500: '#00aef3',
          600: '#2bc3ff',
          700: '#60d2ff',
          800: '#95e1ff',
          900: '#caf0ff',
        },
        // Error/Alert color - Red (CMYK)
        red_cmyk: {
          DEFAULT: '#e81b23',
          100: '#2f0506',
          200: '#5f090c',
          300: '#8e0e12',
          400: '#bd1318',
          500: '#e81b23',
          600: '#ed494f',
          700: '#f2777b',
          800: '#f6a4a7',
          900: '#fbd2d3',
        },
        // Neutral color - Ash Gray
        ash_gray: {
          DEFAULT: '#b2beb5',
          100: '#222823',
          200: '#444f47',
          300: '#65776a',
          400: '#8a9c8f',
          500: '#b2beb5',
          600: '#c1cac4',
          700: '#d1d8d2',
          800: '#e0e5e1',
          900: '#f0f2f0',
        },
        // Accent/Success color - Gold
        gold: {
          DEFAULT: '#ffd700',
          100: '#332b00',
          200: '#665700',
          300: '#998200',
          400: '#ccad00',
          500: '#ffd700',
          600: '#ffe033',
          700: '#ffe866',
          800: '#fff099',
          900: '#fff7cc',
        },
        // Dark background - Night
        night: {
          DEFAULT: '#141414',
          100: '#040404',
          200: '#080808',
          300: '#0c0c0c',
          400: '#101010',
          500: '#141414',
          600: '#434343',
          700: '#727272',
          800: '#a1a1a1',
          900: '#d0d0d0',
        },
      },
    },
  },
  plugins: [],
};

export default config;

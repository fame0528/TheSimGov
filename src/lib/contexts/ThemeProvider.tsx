/**
 * @fileoverview Theme Context Provider
 * @module lib/contexts/ThemeProvider
 * 
 * OVERVIEW:
 * Global theme state management (dark/light mode).
 * Persists theme preference to localStorage.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  /** Current theme */
  theme: Theme;
  /** Toggle theme */
  toggleTheme: () => void;
  /** Set specific theme */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

export interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme */
  defaultTheme?: Theme;
}

/**
 * ThemeProvider - Global theme state
 * 
 * @example
 * ```tsx
 * // In app layout
 * <ThemeProvider defaultTheme="light">
 *   <App />
 * </ThemeProvider>
 * 
 * // In any component
 * const { theme, toggleTheme } = useTheme();
 * <Button onClick={toggleTheme}>
 *   {theme === 'light' ? '🌙' : '☀️'}
 * </Button>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && (stored === 'light' || stored === 'dark')) {
      setThemeState(stored);
    }
  }, []);

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Update document class for CSS
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * useTheme - Access theme context
 * 
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Persistence**: Theme saved to localStorage
 * 2. **CSS Integration**: Updates document class for styling
 * 3. **Toggle**: Easy theme switching
 * 4. **Type Safe**: Only 'light' or 'dark' allowed
 * 
 * PREVENTS:
 * - Duplicate theme management
 * - Losing theme preference on refresh
 * - Inconsistent dark mode implementation
 */

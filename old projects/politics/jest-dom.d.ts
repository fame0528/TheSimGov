/**
 * Jest DOM Type Declarations
 * 
 * Extends Jest matchers with @testing-library/jest-dom custom matchers.
 * This allows TypeScript to recognize matchers like toBeInTheDocument,
 * toBeDisabled, toHaveClass, etc.
 * 
 * Created: 2025-11-18
 * Updated: 2025-11-19
 * ECHO: Test infrastructure type safety
 */

import '@testing-library/jest-dom';

// Explicit global type declaration for Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(html: string): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toBeRequired(): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toHaveValue(value: string | string[] | number | null): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDescription(text: string | RegExp): R;
      toHaveFocus(): R;
      toHaveFormValues(values: Record<string, any>): R;
      toHaveAccessibleDescription(text: string | RegExp): R;
      toHaveAccessibleName(text: string | RegExp): R;
      toHaveErrorMessage(text: string | RegExp): R;
    }
  }
}

export {};

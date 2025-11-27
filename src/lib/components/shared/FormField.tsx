/**
 * @fileoverview Form Field Component
 * @module lib/components/shared/FormField
 * 
 * OVERVIEW:
 * Reusable form field wrapper with label, error, and help text.
 * Consistent form styling across all features.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

'use client';

import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Field type */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  /** Field name */
  name: string;
  /** Field value */
  value: string | number;
  /** Change handler */
  onChange: (value: string | number) => void;
  /** Error message */
  error?: string;
  /** Help text */
  helperText?: string;
  /** Placeholder */
  placeholder?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Select options (for type="select") */
  options?: Array<{ value: string; label: string }>;
}

/**
 * FormField - Consistent form input with validation
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Company Name"
 *   name="name"
 *   value={name}
 *   onChange={setName}
 *   error={errors.name}
 *   helperText="Choose a unique name"
 *   required
 * />
 * 
 * <FormField
 *   label="Industry"
 *   type="select"
 *   name="industry"
 *   value={industry}
 *   onChange={setIndustry}
 *   options={[
 *     { value: 'TECH', label: 'Technology' },
 *     { value: 'FINANCE', label: 'Finance' },
 *   ]}
 * />
 * ```
 */
export function FormField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  required = false,
  disabled = false,
  options = [],
}: FormFieldProps) {
  const isInvalid = !!error;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            name={name}
            value={value as string}
            onValueChange={(val) => onChange(val)}
            placeholder={placeholder}
            isDisabled={disabled}
            minRows={4}
            isInvalid={isInvalid}
            errorMessage={error}
            description={!error && helperText ? helperText : undefined}
          />
        );

      case 'select':
        return (
          <Select
            name={name}
            selectedKeys={value ? [String(value)] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              onChange(selected ? String(selected) : '');
            }}
            placeholder={placeholder || 'Select option'}
            isDisabled={disabled}
            isInvalid={isInvalid}
            errorMessage={error}
            description={!error && helperText ? helperText : undefined}
          >
            {options.map((option) => (
              <SelectItem key={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            name={name}
            value={String(value)}
            onValueChange={(val) => onChange(Number(val) || 0)}
            placeholder={placeholder}
            isDisabled={disabled}
            isInvalid={isInvalid}
            errorMessage={error}
            description={!error && helperText ? helperText : undefined}
          />
        );

      default:
        return (
          <Input
            type={type}
            name={name}
            value={String(value)}
            onValueChange={(val) => onChange(val)}
            placeholder={placeholder}
            isDisabled={disabled}
            isInvalid={isInvalid}
            errorMessage={error}
            description={!error && helperText ? helperText : undefined}
          />
        );
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Support**: Text, email, password, number, textarea, select
 * 2. **Validation**: Error message display via HeroUI Input components
 * 3. **HeroUI Components**: @heroui/input, @heroui/select with built-in validation
 * 4. **Consistent**: Same styling across all forms
 * 5. **Helper Text**: Optional guidance via description prop
 * 
 * PREVENTS:
 * - Duplicate form field implementations
 * - Inconsistent form validation UI
 * - Missing accessibility attributes
 */

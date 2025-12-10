// src/components/auth/FormField.tsx
import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

/**
 * A component for input fields used in login/registration forms.
 * - Includes a label and an input element.
 * - Styled with a dark theme.
 */
const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  required = false,
  autoComplete,
  disabled,
  icon,
}) => {
  const hasIcon = icon != null;

  return (
    <div className="group">
      <label
        htmlFor={id}
        className="block text-xs font-extrabold text-muted-foreground mb-1.5 uppercase tracking-wider group-focus-within:text-foreground transition-colors duration-200"
      >
        {label}
      </label>
      <div className="relative">
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors duration-200">
            {icon}
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          className={`w-full py-1.5 text-sm font-medium text-foreground bg-input border border-border rounded-lg shadow-sm focus:outline-none transition-all duration-200 placeholder:text-muted-foreground ${
            hasIcon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
};

export default FormField;

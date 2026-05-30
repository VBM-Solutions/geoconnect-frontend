import React from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, name, showPasswordToggle, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const inputId = id ?? name;
    const isPasswordField = type === 'password';
    const displayType = isPasswordField && isPasswordVisible ? 'text' : type;
    const shouldShowToggle = showPasswordToggle && isPasswordField;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-semibold text-slate-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
          id={inputId}
          name={name}
          className={cn(
            "flex h-9 w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50",
            error && "border-red-500 focus:ring-red-500",
              shouldShowToggle && "pr-10",
            className
          )}
            type={displayType}
          ref={ref}
          {...props}
        />
          {shouldShowToggle && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              title={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-label={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {isPasswordVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';


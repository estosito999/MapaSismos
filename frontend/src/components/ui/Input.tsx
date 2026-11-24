import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className="w-full mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold mb-1.5 text-zinc-900"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all text-sm ${
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
    </div>
  );
};

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'severe';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 font-semibold rounded-lg transition-colors duration-200 focus:outline-none text-sm disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary:
      'bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900/20 disabled:bg-zinc-300 disabled:text-zinc-500',
    accent:
      'bg-orange-500 text-white hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 disabled:bg-zinc-300 disabled:text-zinc-500',
    outline:
      'bg-transparent border border-zinc-200 text-zinc-900 hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-900/10 disabled:border-zinc-200 disabled:text-zinc-400',
    // RESTRICCIÓN: Solo para emergencias críticas o acciones irreversibles
    severe:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-600/20 disabled:bg-zinc-300',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

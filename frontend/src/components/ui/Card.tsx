import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
}) => {
  return (
    <div
      className={`bg-white border border-zinc-200 rounded-lg shadow-sm p-6 ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-bold text-zinc-900">{title}</h2>}
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

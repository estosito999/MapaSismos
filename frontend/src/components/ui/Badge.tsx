import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'info' | 'severe';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  className = '',
}) => {
  const variants = {
    success: 'bg-emerald-100 text-emerald-800', // Sismo Registrado / Validado
    warning: 'bg-orange-100 text-orange-700',   // Reporte Pendiente / Alerta Moderada
    info: 'bg-sky-100 text-sky-800',            // Revisado / Informativo
    severe: 'bg-rose-100 text-rose-700',        // Alerta Severa (Restringido)
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

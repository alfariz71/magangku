import React from 'react';

export type BadgeVariant = 
  | 'success' // Green
  | 'warning' // Yellow / Orange
  | 'danger'  // Red
  | 'primary' // Blue
  | 'info'    // Sky
  | 'purple'  // Purple
  | 'neutral';// Gray

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string; border: string }> = {
    success: {
      bg: 'bg-[#E8F8EE]',
      text: 'text-[#27AE60]',
      dotColor: 'bg-[#27AE60]',
      border: 'border-[#27AE60]/20'
    },
    warning: {
      bg: 'bg-[#FEF6E7]',
      text: 'text-[#F2994A]',
      dotColor: 'bg-[#F2994A]',
      border: 'border-[#F2994A]/25'
    },
    danger: {
      bg: 'bg-[#FDEEEE]',
      text: 'text-[#EB5757]',
      dotColor: 'bg-[#EB5757]',
      border: 'border-[#EB5757]/20'
    },
    primary: {
      bg: 'bg-[#EBF3FE]',
      text: 'text-[#2F80ED]',
      dotColor: 'bg-[#2F80ED]',
      border: 'border-[#2F80ED]/20'
    },
    info: {
      bg: 'bg-[#E0F2FE]',
      text: 'text-[#0284C7]',
      dotColor: 'bg-[#0284C7]',
      border: 'border-[#0284C7]/20'
    },
    purple: {
      bg: 'bg-[#F3E8FF]',
      text: 'text-[#9333EA]',
      dotColor: 'bg-[#9333EA]',
      border: 'border-[#9333EA]/20'
    },
    neutral: {
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#64748B]',
      dotColor: 'bg-[#94A3B8]',
      border: 'border-[#CBD5E1]/40'
    }
  };

  const current = variantStyles[variant] || variantStyles.primary;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor} shrink-0`} />}
      {children}
    </span>
  );
};

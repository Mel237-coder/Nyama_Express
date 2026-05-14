import React from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-2xl border-none transition-all duration-200 select-none';

  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-5 py-3.5 rounded-2xl',
    lg: 'px-6 py-4 text-lg rounded-2xl',
  };

  const variantClasses: Record<string, string> = {
    primary:
      'bg-[#FFD600] text-[#0A0A0F] shadow-[0_0_20px_rgba(255,214,0,0.3),0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,214,0,0.5),0_6px_16px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:scale-[0.96]',
    ghost:
      'bg-transparent text-white border border-white/15 hover:bg-white/[0.08]',
    danger:
      'bg-[#FF3366] text-white shadow-[0_0_20px_rgba(255,51,102,0.3)] hover:shadow-[0_0_30px_rgba(255,51,102,0.5)] hover:-translate-y-0.5 active:scale-[0.96]',
  };

  const disabledClasses = disabled
    ? 'opacity-40 cursor-not-allowed hover:translate-y-0 active:scale-100 hover:shadow-none'
    : 'cursor-pointer';

  const combined = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={combined}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

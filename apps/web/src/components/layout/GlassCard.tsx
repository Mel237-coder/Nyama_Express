import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  elevated = false,
  onClick,
}) => {
  const baseClasses = elevated ? 'glass-elevated' : 'glass';
  const interactiveClasses = onClick
    ? 'hover:bg-white/5 transition-colors cursor-pointer'
    : '';
  const combined = [baseClasses, interactiveClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={combined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

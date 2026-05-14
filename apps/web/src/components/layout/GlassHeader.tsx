import React from 'react';

interface GlassHeaderProps {
  title: string;
  right?: React.ReactNode;
  sticky?: boolean;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  right,
  sticky = true,
}) => {
  return (
    <header
      className={
        sticky
          ? 'sticky top-0 z-30 px-4 py-3 flex items-center justify-between'
          : 'px-4 py-3 flex items-center justify-between'
      }
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
};

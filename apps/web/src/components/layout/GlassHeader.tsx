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
          ? 'sticky top-0 z-30 px-5 py-3.5 flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-[#E7E5E4]'
          : 'px-5 py-3.5 flex items-center justify-between bg-white border-b border-[#E7E5E4]'
      }
    >
      <h1 className="text-lg font-bold text-[#1C1917] tracking-tight">{title}</h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
};

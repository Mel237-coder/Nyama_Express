import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  count: number;
  accentColor: string;
  children: ReactNode;
}

export function KanbanColumn({ title, count, accentColor, children }: KanbanColumnProps) {
  return (
    <div className="flex w-80 min-w-[320px] flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn('h-3 w-3 rounded-full', accentColor)} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-muted/50 p-2">
        {children}
      </div>
    </div>
  );
}
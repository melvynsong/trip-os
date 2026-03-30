import * as React from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';

// Typography tokens/styles
export const typography = {
  pageTitle: 'font-serif text-3xl font-bold text-slate-900',
  sectionTitle: 'text-xl font-semibold text-slate-800',
  dayTitle: 'text-lg font-semibold text-slate-800',
  cardTitle: 'text-base font-semibold text-slate-900',
  cardSubtitle: 'text-sm font-medium text-slate-600',
  meta: 'text-xs font-medium text-slate-500',
  label: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
  helper: 'text-xs text-slate-400',
};


type TypographyProps = {
  as?: keyof React.JSX.IntrinsicElements;
  variant?: keyof typeof typography;
  className?: string;
  children: ReactNode;
  [key: string]: any;
};

export function Typography({ as = 'div', variant = 'cardTitle', className = '', children, ...props }: TypographyProps) {
  const Comp = as as any;
  return (
    <Comp className={clsx(typography[variant], className)} {...props}>
      {children}
    </Comp>
  );
}

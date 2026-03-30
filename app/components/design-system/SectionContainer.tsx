import * as React from 'react';
import clsx from 'clsx';

export function SectionContainer({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={clsx(
        'mb-8 md:mb-12',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

import * as React from 'react';
import clsx from 'clsx';

export function PageContainer({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'max-w-4xl mx-auto px-4 sm:px-6 md:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

import * as React from 'react';
import clsx from 'clsx';

export function CardContainer({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'space-y-5', // vertical gap between cards
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

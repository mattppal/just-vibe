import React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}

const getAlertColors = (type: AlertProps['type'] = 'info') => {
  switch (type) {
    case 'info':
      return 'bg-blue-900/20 border-blue-500 text-blue-200';
    case 'warning':
      return 'bg-amber-900/20 border-amber-500 text-amber-200';
    case 'error':
      return 'bg-red-900/20 border-red-500 text-red-200';
    case 'success':
      return 'bg-green-900/20 border-green-500 text-green-200';
    default:
      return 'bg-blue-900/20 border-blue-500 text-blue-200';
  }
};

export default function Alert({ type = 'info', title, children }: AlertProps) {
  const colorClasses = getAlertColors(type);
  
  return (
    <div className={cn(
      'rounded-md border-l-4 p-4 my-4',
      colorClasses
    )}>
      {title && (
        <h5 className="text-lg font-medium mb-2">{title}</h5>
      )}
      <div className="text-sm">{children}</div>
    </div>
  );
}
import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}

export function Alert({ type = 'info', title, children }: AlertProps) {
  const icons = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />
  };

  const styles = {
    info: 'bg-blue-900/20 border-blue-800 text-blue-100',
    warning: 'bg-yellow-900/20 border-yellow-800 text-yellow-100',
    error: 'bg-red-900/20 border-red-800 text-red-100',
    success: 'bg-green-900/20 border-green-800 text-green-100'
  };

  return (
    <div className={cn('p-4 border rounded-md mb-4', styles[type])}>
      <div className="flex gap-2 mb-2 items-center">
        {icons[type]}
        {title && <div className="font-medium">{title}</div>}
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
}

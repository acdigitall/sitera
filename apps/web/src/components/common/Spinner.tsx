import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 22,
  className = 'text-indigo-600',
  text,
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-2.5 text-slate-500">
      <Loader2 size={size} className={`animate-spin ${className}`} />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        {content}
      </div>
    );
  }

  return content;
};

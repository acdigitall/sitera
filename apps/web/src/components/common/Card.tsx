import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-xl shadow-sm p-5 transition-all hover:border-slate-300 hover:shadow-md ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

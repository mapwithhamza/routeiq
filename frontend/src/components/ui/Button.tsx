import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export default function Button({
  children,
  isLoading,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-500 border border-gray-300 dark:border-gray-700",
    danger: "bg-red-600/10 text-red-500 hover:bg-red-600/20 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500",
  };

  return (
    <button
      disabled={isLoading || disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
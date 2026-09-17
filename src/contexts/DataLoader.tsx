import React from 'react';
import { useData } from './DataContext';

export const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, error } = useData();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">Loading database...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-red-500">Error: {error}</div>;

  return <>{children}</>;
};

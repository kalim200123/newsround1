"use client";

import { cn } from '@/lib/utils';
import React from 'react';

interface TabButtonProps<T extends string | number> {
  id: T;
  label: React.ReactNode;
  activeId: T;
  onClick: (id: T) => void;
  baseClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  Icon?: React.ElementType; // For Lucide icons or similar
  iconSize?: number;
  iconClassName?: string;
}

export default function TabButton<T extends string | number>({
  id,
  label,
  activeId,
  onClick,
  baseClassName,
  activeClassName,
  inactiveClassName,
  Icon,
  iconSize = 20,
  iconClassName,
}: TabButtonProps<T>) {
  const isActive = activeId === id;

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        baseClassName,
        isActive ? activeClassName : inactiveClassName
      )}
    >
      {Icon && <Icon size={iconSize} className={iconClassName} />}
      {label}
    </button>
  );
}

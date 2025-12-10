import { LucideIcon } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-card/50 rounded-lg border-2 border-dashed border-border">
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

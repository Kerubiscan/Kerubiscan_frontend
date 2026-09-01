import React from 'react';

export type StatusVariant = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'warning';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as StatusVariant;
  
  const getStyles = (variant: StatusVariant) => {
    switch (variant) {
      case 'critical':
        return 'bg-status-critical/10 text-status-critical border border-status-critical/20';
      case 'high':
        return 'bg-status-high/10 text-status-high border border-status-high/20';
      case 'medium':
        return 'bg-status-medium/10 text-status-medium border border-status-medium/20';
      case 'low':
        return 'bg-status-low/10 text-status-low border border-status-low/20';
      case 'success':
        return 'bg-status-info/10 text-status-info border border-status-info/20'; // using green/info color from tailwind config
      case 'warning':
        return 'bg-status-medium/10 text-status-medium border border-status-medium/20';
      case 'info':
      default:
        return 'bg-surface text-text-muted border border-border';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyles(normalizedStatus)}`}>
      {label}
    </span>
  );
}

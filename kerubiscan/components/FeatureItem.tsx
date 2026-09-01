import React from "react";
import { LucideIcon } from "lucide-react";

export interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex flex-col items-start text-left">
      <div className="w-14 h-14 rounded-xl border border-primary/30 flex items-center justify-center bg-primary/5 mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}

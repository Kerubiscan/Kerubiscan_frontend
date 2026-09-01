import { type LucideIcon } from "lucide-react";

export interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="feature-item">
      <div className="feature-icon-wrapper">
        <Icon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}

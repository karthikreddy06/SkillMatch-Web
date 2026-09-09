import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  showText = true,
  label = 'Verified Company',
  className = '',
  style = {},
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 10 : isLg ? 14 : 12;
  const badgeHeight = isSm ? '18px' : isLg ? '26px' : '22px';
  const fontSize = isSm ? '0.68rem' : isLg ? '0.82rem' : '0.74rem';
  const padding = isSm ? '0 6px' : isLg ? '0 10px' : '0 8px';

  return (
    <span
      className={`verified-company-badge ${className}`}
      title="SkillMatch Verified Authenticity — Business registration, CIN, and tax credentials verified."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        height: badgeHeight,
        padding: padding,
        borderRadius: '9999px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.16) 0%, rgba(59, 130, 246, 0.22) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        color: '#38BDF8',
        fontSize: fontSize,
        fontWeight: 600,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)',
        userSelect: 'none',
        verticalAlign: 'middle',
        cursor: 'help',
        ...style,
      }}
    >
      <span
        style={{
          width: iconSize + 4,
          height: iconSize + 4,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <Check size={iconSize} strokeWidth={3.2} />
      </span>
      {showText && <span>{label}</span>}
    </span>
  );
};

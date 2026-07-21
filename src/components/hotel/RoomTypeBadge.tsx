import React from 'react';
import { COLOR_MAP } from './roomColorMap';

export const RoomTypeBadge = ({ type, className = "text-[11px]" }: { type: any, className?: string }) => {
  if (!type || !type.type_name) return null;
  const typeColor = type.color || 'gray';
  const isHex = typeColor.startsWith('#');
  
  if (isHex) {
    const cleanHex = typeColor.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
    const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
    const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    const textColor = yiq >= 128 ? '#1a1c1c' : '#ffffff';
    
    return (
      <span 
        className={`px-2 py-0.5 rounded-full font-medium ${className}`} 
        style={{ backgroundColor: typeColor, color: textColor }}
      >
        {type.type_name}
      </span>
    );
  }
  
  const badgeClass = COLOR_MAP[typeColor as keyof typeof COLOR_MAP]?.badge || COLOR_MAP.gray.badge;
  return (
    <span className={`px-2 py-0.5 rounded-full font-medium ${badgeClass} ${className}`}>
      {type.type_name}
    </span>
  );
};

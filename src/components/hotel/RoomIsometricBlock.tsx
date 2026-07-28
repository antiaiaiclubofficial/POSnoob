import React from 'react';
import { cn } from '@/lib/utils';
import { COLOR_MAP } from './roomColorMap';

interface RoomIsometricBlockProps {
  type: any;
  status: 'maintenance' | 'cleaning' | 'empty' | 'reserved' | 'occupied';
  onClick?: () => void;
  children?: React.ReactNode;
}

export const RoomIsometricBlock: React.FC<RoomIsometricBlockProps> = ({
  type,
  status,
  onClick,
  children
}) => {
  const typeColor = type?.color || 'gray';
  const isHex = typeColor.startsWith('#');

  // The floor color should be very subtle to look like a house floor.
  // We can use a light beige or the type color heavily washed out.
  // If the room is occupied, the floor color should be grey.
  const floorBg = status === 'occupied' ? '#9ca3af' : (isHex ? typeColor : '#f3f4f6');

  let opacityClass = 'opacity-100';
  if (status === 'maintenance') opacityClass = 'opacity-40 grayscale';
  if (status === 'cleaning') opacityClass = 'opacity-60';

  return (
    <div
      className={cn("relative group cursor-pointer transition-transform duration-300 hover:-translate-y-2", opacityClass)}
      style={{ width: '160px', height: '160px', transformStyle: 'preserve-3d' }}
      onClick={onClick}
    >
      {/* Platform Top (Floor) */}
      <div
        className="absolute inset-0 border border-black/10 overflow-hidden"
        style={{
          backgroundColor: '#f8f9fa',
          transform: 'translateZ(0px)',
        }}
      >
        {/* Subtle grid pattern for floor / parquet */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        
        {/* Color accent for room type */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{ backgroundColor: floorBg }}
        />
      </div>

      {/* Left Wall (Inner) */}
      <div
        className="absolute top-0 left-0 w-[10px] h-full bg-white border-r border-black/5"
        style={{ transformOrigin: 'left', transform: 'rotateY(90deg) translateZ(0)' }}
      />
      
      {/* Top Wall (Inner) */}
      <div
        className="absolute top-0 left-0 w-full h-[10px] bg-[#f0f0f0] border-b border-black/5"
        style={{ transformOrigin: 'top', transform: 'rotateX(-90deg) translateZ(0)' }}
      />

      {/* Floating Card Content */}
      <div
        className="absolute top-1/2 left-1/2 pointer-events-none"
        style={{
          transform: 'translateZ(120px) rotateZ(45deg) rotateX(-60deg) translate(-50%, -50%)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="pointer-events-auto transition-transform duration-300 ease-in-out" style={{ animation: 'floating 4s ease-in-out infinite' }}>
          <div className="scale-75 origin-bottom transition-transform duration-300 group-hover:scale-90">
            {children}
          </div>
        </div>

        {/* Connection Line pointing down */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 h-[70px] w-[1px] bg-gradient-to-b from-white to-transparent pointer-events-none shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
        {/* Dot on the floor */}
        <div className="absolute top-[calc(100%+70px)] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none" />
      </div>

      <style>{`
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

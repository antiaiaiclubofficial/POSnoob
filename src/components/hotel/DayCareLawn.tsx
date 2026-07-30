import React, { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { RoomDetailCard } from './RoomDetailPopover';

interface DayCareLawnProps {
  bookings: any[];
  searchQuery: string;
  onBookingClick: (booking: any) => void;
  onCheckout: (bookingId: string) => void;
}

const getAnimalEmoji = (species: string) => {
  const s = (species || '').toLowerCase();
  if (s.includes('dog') || s.includes('หมา') || s.includes('สุนัข')) return '🐕'; // Full body dog
  if (s.includes('cat') || s.includes('แมว')) return '🐈'; // Full body cat
  if (s.includes('rabbit') || s.includes('กระต่าย')) return '🐇'; // Full body rabbit
  if (s.includes('bird') || s.includes('นก')) return '🕊️';
  if (s.includes('turtle') || s.includes('เต่า')) return '🐢';
  return '🐕'; // fallback to dog standing
};

const FenceWall3D = ({ length, axis, x, y }: { length: number, axis: 'x' | 'y', x: number, y: number }) => {
  return (
    <div 
      className="absolute"
      style={{
        left: x,
        top: y,
        transformStyle: 'preserve-3d',
        transform: axis === 'x' ? 'none' : 'rotateZ(90deg)'
      }}
    >
      <div 
        className="absolute flex overflow-visible"
        style={{
          left: 0,
          bottom: 0,
          width: length,
          height: 80,
          transformOrigin: 'bottom left',
          transform: 'rotateX(-90deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute w-full bg-[#8d6e63] shadow-md border-b border-[#5d4037]/50" style={{ height: 8, bottom: 20, transform: 'translateZ(1px)' }} />
        <div className="absolute w-full bg-[#8d6e63] shadow-md border-b border-[#5d4037]/50" style={{ height: 8, bottom: 50, transform: 'translateZ(1px)' }} />
        
        {Array.from({ length: Math.floor(length / 80) }).map((_, i) => (
          <div 
            key={i} 
            className="absolute w-6 h-[80px] bg-[#a1887f] rounded-t-sm shadow-md border-r border-[#5d4037]/50"
            style={{ left: i * 80, bottom: 0, transform: 'translateZ(2px)' }}
          >
            <div className="w-full h-full opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, #5d4037 50%)', backgroundSize: '4px 100%' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const LAWN_WIDTH = 1000;
const LAWN_HEIGHT = 800;

// Static environment props (trees, bushes, flowers) to place around the edges
const ENV_PROPS = [
  { type: 'tree1', emoji: '🌳', size: 120, x: 50, y: 50 },
  { type: 'tree2', emoji: '🌲', size: 100, x: 920, y: 80 },
  { type: 'tree3', emoji: '🌳', size: 130, x: 70, y: 700 },
  { type: 'bush1', emoji: '🪴', size: 60, x: 850, y: 720 },
  { type: 'flower1', emoji: '🌷', size: 40, x: 150, y: 150 },
  { type: 'flower2', emoji: '🌻', size: 40, x: 800, y: 120 },
  { type: 'bush2', emoji: '🪴', size: 50, x: 120, y: 500 },
  { type: 'flower3', emoji: '🌼', size: 30, x: 200, y: 750 },
  { type: 'mushroom', emoji: '🍄', size: 30, x: 750, y: 650 },
  { type: 'toy1', emoji: '⚽', size: 24, x: 400, y: 300 },
  { type: 'toy2', emoji: '🦴', size: 24, x: 600, y: 500 },
];

const AnimatedAnimal = ({ booking, onClick, onCheckout }: { booking: any, onClick: () => void, onCheckout: (id: string) => void }) => {
  const margin = 120; // Keep away from fences
  const getRandPos = () => ({
    x: margin + Math.random() * (LAWN_WIDTH - margin * 2),
    y: margin + Math.random() * (LAWN_HEIGHT - margin * 2)
  });

  const [pos, setPos] = useState(getRandPos());
  const [isJumping, setIsJumping] = useState(false);
  const [facingLeft, setFacingLeft] = useState(Math.random() > 0.5);
  const [moveDuration, setMoveDuration] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Randomly move every 8 to 15 seconds for a more natural resting period
    const timeout = setTimeout(function move() {
      const nextPos = getRandPos();
      
      // Calculate distance to determine natural walking speed
      const dist = Math.hypot(nextPos.x - pos.x, nextPos.y - pos.y);
      const duration = dist * 20; // 20ms per pixel (very slow, e.g. 400px = 8 seconds)
      
      setMoveDuration(duration);
      setFacingLeft(nextPos.x < pos.x);
      setPos(nextPos);
      
      // Gentle bobbing effect while walking
      let bobCount = 0;
      const totalBobs = Math.floor(duration / 600); // One bob every 600ms
      
      const bobInterval = setInterval(() => {
        setIsJumping(j => !j);
        bobCount++;
        if (bobCount >= totalBobs * 2) {
          clearInterval(bobInterval);
          setIsJumping(false);
        }
      }, 300); // 300ms up, 300ms down
      
      // Schedule next move after this one finishes, plus a random resting period
      setTimeout(move, duration + 5000 + Math.random() * 7000);
    }, 2000 + Math.random() * 3000); // Initial delay

    return () => clearTimeout(timeout);
  }, [pos.x, pos.y]); // Include pos in dependency to calculate distance accurately, but timeout ensures no loop

  const pet = booking.pets;
  const species = pet?.type || pet?.species || '';
  const emoji = getAnimalEmoji(species);
  
  const isOverdue = booking.status === 'checked_in' && booking.check_out_expected && new Date(booking.check_out_expected) < new Date();
  const isWaiting = booking.status === 'reserved';
  const isCheckedIn = booking.status === 'checked_in' && !isOverdue;
  
  const activities = booking.hotel_activities || [];
  const pendingActivitiesCount = activities.filter((a: any) => a.status !== 'done').length;

  let statusDotColor = '';
  if (isOverdue) statusDotColor = 'bg-red-500';
  else if (isWaiting) statusDotColor = 'bg-[#ffb300]'; // Distinct amber/yellow to contrast with red
  else if (isCheckedIn) statusDotColor = 'bg-[#7cb342]';
  
  return (
    <HoverCard openDelay={200} closeDelay={300} open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <div
          className="absolute cursor-pointer group"
          style={{
            left: pos.x,
            top: pos.y,
            transformStyle: 'preserve-3d',
            transition: `all ${moveDuration}ms ease-in-out`,
            zIndex: Math.floor(pos.y + pos.x), // Depth sorting based on Y and X
          }}
          onClick={onClick}
        >
          {/* Billboard Transform facing camera */}
          <div
            className="pointer-events-auto"
            style={{
              transform: 'translateZ(10px) rotateZ(45deg) rotateX(-60deg) translate(-50%, -50%)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* RPG Style Name Tag (Always visible, interactive on hover) */}
            <div className="absolute bottom-[90%] left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-white/90 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.15)] px-3 py-1 rounded-[16px] text-sm font-bold text-[#6d4c41] border-2 border-white transition-all duration-300 pointer-events-none origin-bottom transform scale-100 group-hover:scale-125 group-hover:-translate-y-2 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] group-hover:bg-[#fff9eb] z-20">
              {pet?.name || 'ไม่ระบุชื่อ'}
              
              {/* Activity Notification Badge */}
              {pendingActivitiesCount > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-black shadow-sm animate-bounce">
                  {pendingActivitiesCount}
                </div>
              )}
            </div>

            {/* Animal Character */}
            <div 
              className={cn(
                "relative flex items-center justify-center w-24 h-24 transition-transform duration-300 origin-bottom",
                facingLeft ? "scale-x-[-1]" : "",
                isJumping ? "-translate-y-2 rotate-2" : "translate-y-0",
                "group-hover:scale-110"
              )}
            >
              <span className="text-[72px] filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)] select-none">{emoji}</span>
              
              {/* Status indicator */}
              {statusDotColor && (
                <span className={cn("absolute top-0 right-0 w-5 h-5 border-2 border-white rounded-full shadow-md z-10", statusDotColor)} />
              )}
            </div>

            {/* Soft Shadow under animal */}
            <div 
              className={cn(
                "absolute top-[calc(100%-10px)] left-1/2 -translate-x-1/2 w-16 h-5 bg-black/25 rounded-[100%] blur-[3px] -z-10 transition-all duration-300",
                isJumping ? "scale-75 opacity-20" : "scale-100 opacity-100"
              )} 
            />
          </div>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={24}
        className="w-96 rounded-3xl bg-white/80 backdrop-blur-3xl p-6 shadow-[0_24px_60px_-12px_rgba(141,110,99,0.3)] border-4 border-white/50 z-50"
      >
        <RoomDetailCard
          booking={booking}
          room={booking.hotel_rooms}
          onCheckout={() => {
            setIsOpen(false);
            onCheckout(booking.id);
          }}
          onEdit={() => {
            setIsOpen(false);
            onClick();
          }}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

export const DayCareLawn: React.FC<DayCareLawnProps> = ({ bookings, searchQuery, onBookingClick, onCheckout }) => {
  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    return bookings.filter(b => {
      const petName = b.pets?.name || '';
      return petName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [bookings, searchQuery]);

  return (
    <div 
      className="relative flex items-center justify-center pointer-events-none" 
      style={{ width: LAWN_WIDTH, height: LAWN_HEIGHT, transformStyle: 'preserve-3d' }}
    >
      {/* 3D Farm Block Base */}
      <div 
        className="absolute inset-0 bg-[#aed581] rounded-[40px] pointer-events-auto shadow-2xl"
        style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}
      >
        {/* Dirt/Soil Layer underneath (Right edge) */}
        <div 
          className="absolute top-[40px] -right-[20px] h-[calc(100%-80px)] w-[20px] bg-[#8d6e63] rounded-r-[20px]" 
          style={{ transformOrigin: 'left', transform: 'rotateY(90deg) translateZ(-10px)' }}
        >
          {/* Texture for dirt */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#5d4037 20%, transparent 20%)', backgroundSize: '10px 10px' }} />
        </div>
        
        {/* Dirt/Soil Layer underneath (Bottom edge) */}
        <div 
          className="absolute -bottom-[20px] left-[40px] w-[calc(100%-80px)] h-[20px] bg-[#795548] rounded-b-[20px]" 
          style={{ transformOrigin: 'top', transform: 'rotateX(-90deg) translateZ(-10px)' }}
        >
          {/* Texture for dirt */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4e342e 20%, transparent 20%)', backgroundSize: '10px 10px' }} />
        </div>

        {/* Grass Surface Texture */}
        <div 
          className="absolute inset-0 opacity-30 rounded-[40px] overflow-hidden pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(#8bc34a 20%, transparent 20%),
              radial-gradient(#8bc34a 20%, transparent 20%)
            `,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }}
        />

        {/* Wooden Fence Around the Perimeter (Ground Trace) */}
        <div className="absolute inset-[12px] border-[4px] border-dashed border-[#8d6e63]/40 rounded-[28px] pointer-events-none" />
        
        {/* Center Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none flex flex-col items-center">
          <span className="text-[120px] font-black text-[#558b2f] tracking-tighter filter blur-[1px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>Day Care</span>
          <span className="text-[50px] text-[#558b2f] font-bold">Farm & Playground</span>
        </div>
      </div>



      {/* Render 3D Fences on Back-Right and Front-Right */}
      <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
        <FenceWall3D length={LAWN_WIDTH} axis="x" x={0} y={0} />
        <FenceWall3D length={LAWN_HEIGHT} axis="y" x={LAWN_WIDTH} y={0} />
      </div>

      {/* Render Environment Props (Trees, Bushes, etc) */}
      <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
        {ENV_PROPS.map((prop, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{
              left: prop.x,
              top: prop.y,
              transformStyle: 'preserve-3d',
              zIndex: prop.y,
            }}
          >
            <div
              style={{
                transform: 'translateZ(5px) rotateZ(45deg) rotateX(-60deg) translate(-50%, -50%)',
                fontSize: prop.size,
                lineHeight: 1,
              }}
              className="filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.2)]"
            >
              {prop.emoji}
            </div>
            {/* Prop Shadow */}
            <div className="absolute top-full left-0 -translate-x-1/2 w-1/2 h-1/4 bg-black/20 rounded-full blur-[4px] -z-10" />
          </div>
        ))}
      </div>

      {/* Render Animals */}
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        {filteredBookings.map(booking => (
          <AnimatedAnimal 
            key={booking.id} 
            booking={booking} 
            onClick={() => onBookingClick(booking)}
            onCheckout={onCheckout}
          />
        ))}

        {filteredBookings.length === 0 && (
          <div
            className="absolute top-1/2 left-1/2 text-[#5d4037] text-2xl font-bold bg-[#fff9eb]/90 px-8 py-4 rounded-full backdrop-blur-sm pointer-events-none shadow-xl border-4 border-white"
            style={{
              transform: 'translateZ(40px) rotateZ(45deg) rotateX(-60deg) translate(-50%, -50%)',
            }}
          >
            ยังไม่มีสัตว์เลี้ยงฝากดูแลตอนนี้ 💤
          </div>
        )}
      </div>
    </div>
  );
};

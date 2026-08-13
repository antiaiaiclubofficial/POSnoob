import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  ChevronDown,
  Crown, Gem, Star, Award, Heart, Zap, Gift, Rocket, Sparkles, 
  Target, ShieldCheck, Badge, Flame, Trophy, Diamond, Bookmark, 
  CheckCircle2, Flag, Key, ThumbsUp, HelpCircle
} from 'lucide-react';

export const PREMIUM_ICONS = [
  'Crown', 'Gem', 'Star', 'Award', 'Heart', 'Zap', 'Gift', 'Rocket', 
  'Sparkles', 'Target', 'ShieldCheck', 'Badge', 'Flame', 'Trophy', 
  'Diamond', 'Bookmark', 'CheckCircle2', 'Flag', 'Key', 'ThumbsUp'
];

export const getIconComponent = (name: string) => {
  switch (name) {
    case 'Crown': return Crown;
    case 'Gem': return Gem;
    case 'Star': return Star;
    case 'Award': return Award;
    case 'Heart': return Heart;
    case 'Zap': return Zap;
    case 'Gift': return Gift;
    case 'Rocket': return Rocket;
    case 'Sparkles': return Sparkles;
    case 'Target': return Target;
    case 'ShieldCheck': return ShieldCheck;
    case 'Badge': return Badge;
    case 'Flame': return Flame;
    case 'Trophy': return Trophy;
    case 'Diamond': return Diamond;
    case 'Bookmark': return Bookmark;
    case 'CheckCircle2': return CheckCircle2;
    case 'Flag': return Flag;
    case 'Key': return Key;
    case 'ThumbsUp': return ThumbsUp;
    default: return HelpCircle; // Fallback icon
  }
};

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
  triggerClassName?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ 
  value, 
  onChange, 
  className,
  triggerClassName 
}) => {
  const [open, setOpen] = useState(false);
  const CurrentIcon = getIconComponent(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-sm font-bold text-[#1A1F3D] hover:bg-gray-50 transition-colors w-[140px] justify-between",
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2">
            <CurrentIcon size={16} />
            <span className="truncate">{value || 'Icon'}</span>
          </div>
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[280px] p-2 rounded-2xl", className)} align="end">
        <div className="grid grid-cols-5 gap-2">
          {PREMIUM_ICONS.map(iconName => {
            const IconBtn = getIconComponent(iconName);
            return (
              <button
                key={iconName}
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl gap-1 transition-all hover:bg-gray-50",
                  value === iconName && "bg-[#1A1F3D] text-white hover:bg-[#1A1F3D]"
                )}
                title={iconName}
              >
                <IconBtn size={20} />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

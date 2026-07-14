export interface RoomConfig {
  id: number;
  name: string;
  color: 'gray' | 'blue' | 'pink' | 'green' | 'purple' | 'amber';
}

export const COLOR_MAP = {
  gray: {
    bg: "bg-[#ffffff] text-[#1a1c1c] shadow-[0_4px_16px_rgba(24,35,74,0.03)] hover:shadow-[0_8px_24px_rgba(24,35,74,0.08)]",
    border: "border-transparent",
    dot: "bg-[#18234a]",
    badge: "bg-[#f3f3f3] text-[#1a1c1c]"
  },
  blue: {
    bg: "bg-[#dce1ff] text-[#0d193f] hover:bg-[#bac4f5]",
    border: "border-transparent",
    dot: "bg-[#020d35]",
    badge: "bg-[#18234a] text-white"
  },
  pink: {
    bg: "bg-[#ffdad6] text-[#93000a] hover:bg-[#ffb4ab]",
    border: "border-transparent",
    dot: "bg-[#ba1a1a]",
    badge: "bg-[#93000a] text-white"
  },
  green: {
    bg: "bg-[#daed5b] text-[#1a1e00] hover:bg-[#bed041]",
    border: "border-transparent",
    dot: "bg-[#1a1e00]",
    badge: "bg-[#232800] text-white"
  },
  purple: {
    bg: "bg-[#d9d6fe] text-[#191836] hover:bg-[#c5c3ea]",
    border: "border-transparent",
    dot: "bg-[#191836]",
    badge: "bg-[#5c5b7d] text-white"
  },
  amber: {
    bg: "bg-[#FBE8E8] text-[#8E171D] hover:bg-[#F3C2C2]",
    border: "border-transparent",
    dot: "bg-[#8E171D]",
    badge: "bg-[#8E171D] text-white"
  }
};

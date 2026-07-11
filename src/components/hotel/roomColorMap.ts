export interface RoomConfig {
  id: number;
  name: string;
  color: 'gray' | 'blue' | 'pink' | 'green' | 'purple' | 'amber';
}

export const COLOR_MAP = {
  gray: {
    bg: "bg-[#F5F6FA] border-transparent text-gray-500 hover:bg-gray-100",
    border: "border-gray-300",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600"
  },
  blue: {
    bg: "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100/70",
    border: "border-blue-400",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700"
  },
  pink: {
    bg: "bg-pink-50 border-pink-100 text-pink-600 hover:bg-pink-100/70",
    border: "border-pink-400",
    dot: "bg-pink-500",
    badge: "bg-pink-100 text-pink-700"
  },
  green: {
    bg: "bg-green-50 border-green-100 text-green-600 hover:bg-green-100/70",
    border: "border-green-400",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700"
  },
  purple: {
    bg: "bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100/70",
    border: "border-purple-400",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700"
  },
  amber: {
    bg: "bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100/70",
    border: "border-amber-400",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700"
  }
};

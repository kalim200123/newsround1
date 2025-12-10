// lib/categoryColors.ts

export interface CategoryTheme {
  text: string;
  border: string;
  bg: string;
  accentName: string;
  hoverBorder: string;
  hoverText: string;
  wallBg: string;
  holoBg: string;
}

export const CATEGORY_THEMES: { [key: string]: CategoryTheme } = {
  '정치': {
    text: 'text-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    accentName: 'blue',
    hoverBorder: 'hover:border-blue-500',
    hoverText: 'group-hover:text-blue-500',
    wallBg: 'bg-blue-900/10',
    holoBg: 'bg-blue-500/10',
  },
  '경제': {
    text: 'text-green-500',
    border: 'border-green-500',
    bg: 'bg-green-500',
    accentName: 'green',
    hoverBorder: 'hover:border-green-500',
    hoverText: 'group-hover:text-green-500',
    wallBg: 'bg-green-900/10',
    holoBg: 'bg-green-500/10',
  },
  '사회': {
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    bg: 'bg-yellow-500',
    accentName: 'yellow',
    hoverBorder: 'hover:border-yellow-500',
    hoverText: 'group-hover:text-yellow-500',
    wallBg: 'bg-yellow-900/10',
    holoBg: 'bg-yellow-500/10',
  },
  '문화': {
    text: 'text-purple-500',
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    accentName: 'purple',
    hoverBorder: 'hover:border-purple-500',
    hoverText: 'group-hover:text-purple-500',
    wallBg: 'bg-purple-900/10',
    holoBg: 'bg-purple-500/10',
  },
  '스포츠': {
    text: 'text-orange-500',
    border: 'border-orange-500',
    bg: 'bg-orange-500',
    accentName: 'orange',
    hoverBorder: 'hover:border-orange-500',
    hoverText: 'group-hover:text-orange-500',
    wallBg: 'bg-orange-900/10',
    holoBg: 'bg-orange-500/10',
  },
  'default': {
    text: 'text-zinc-500',
    border: 'border-zinc-500',
    bg: 'bg-zinc-500',
    accentName: 'zinc',
    hoverBorder: 'hover:border-zinc-500',
    hoverText: 'group-hover:text-zinc-500',
    wallBg: 'bg-zinc-900/10',
    holoBg: 'bg-zinc-500/10',
  }
};

export const getCategoryTheme = (category: string): CategoryTheme => {
  return CATEGORY_THEMES[category] || CATEGORY_THEMES['default'];
};

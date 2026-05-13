export const GRID_SIZE = 12;
export const SERVER_URL = 'http://localhost:3001';

// Powerup styles use the new warm palette via inline hex (single source of truth).
// Each powerup gets a face color (button bg) and edge (chunky bottom shadow).
export const POWERUP_CONFIG = [
  {
    type: 'freeze',
    label: 'Freeze',
    emoji: '❄️',
    bg: 'bg-accent-teal',
    hover: 'hover:brightness-105',
    badge: 'bg-white',
    badgeText: 'text-accent-teal',
  },
  {
    type: 'hint',
    label: 'Hint',
    emoji: '💡',
    bg: 'bg-accent-orange',
    hover: 'hover:brightness-105',
    badge: 'bg-white',
    badgeText: 'text-accent-orange',
  },
  {
    type: 'fog',
    label: 'Scramble',
    emoji: '🌫️',
    bg: 'bg-ink',
    hover: 'hover:brightness-110',
    badge: 'bg-white',
    badgeText: 'text-ink',
  },
  {
    type: 'bonus',
    label: 'Bonus',
    emoji: '⭐',
    bg: 'bg-accent-green',
    hover: 'hover:brightness-105',
    badge: 'bg-white',
    badgeText: 'text-accent-green',
  },
  {
    type: 'drain',
    label: 'Drain',
    emoji: '🩸',
    bg: 'bg-accent-red',
    hover: 'hover:brightness-105',
    badge: 'bg-white',
    badgeText: 'text-accent-red',
  },
  {
    type: 'rotate',
    label: 'Rotate',
    emoji: '🔄',
    bg: 'bg-accent-orange',
    hover: 'hover:brightness-105',
    badge: 'bg-white',
    badgeText: 'text-accent-orange',
  },
  {
    type: 'shield',
    label: 'Shield',
    emoji: '🛡️',
    bg: 'bg-accent-teal',
    hover: 'hover:brightness-105',
    badge: 'bg-white',
    badgeText: 'text-accent-teal',
  },
  {
    type: 'blind',
    label: 'Blind',
    emoji: '🙈',
    bg: 'bg-accent-red',
    hover: 'hover:brightness-105',
    badge: 'bg-white',
    badgeText: 'text-accent-red',
  },
];

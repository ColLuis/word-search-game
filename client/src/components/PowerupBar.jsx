import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';

const POWERUP_CONFIG = [
  { type: 'freeze', label: 'Freeze', bg: 'bg-cyan-800', hover: 'hover:bg-cyan-700', badge: 'bg-cyan-500', badgeText: '' },
  { type: 'hint', label: 'Hint', bg: 'bg-yellow-800', hover: 'hover:bg-yellow-700', badge: 'bg-yellow-500', badgeText: 'text-black' },
  { type: 'fog', label: 'Fog', bg: 'bg-purple-800', hover: 'hover:bg-purple-700', badge: 'bg-purple-500', badgeText: '' },
  { type: 'bonus', label: 'Bonus', bg: 'bg-green-800', hover: 'hover:bg-green-700', badge: 'bg-green-500', badgeText: 'text-black' },
  { type: 'steal', label: 'Steal', bg: 'bg-red-800', hover: 'hover:bg-red-700', badge: 'bg-red-500', badgeText: '' },
];

export default function PowerupBar() {
  const { state } = useGame();
  const { powerups } = state;

  const handleUse = (type) => {
    getSocket().emit('powerup:use', { type });
  };

  const available = POWERUP_CONFIG.filter((p) => powerups[p.type] > 0);

  if (available.length === 0) return null;

  return (
    <div className="flex gap-2 justify-center mt-2 flex-wrap">
      {available.map(({ type, label, bg, hover, badge, badgeText }) => (
        <button
          key={type}
          onClick={() => handleUse(type)}
          className={`flex items-center gap-1 ${bg} ${hover} text-white text-sm px-3 py-1.5 rounded-lg transition`}
        >
          <span>{label}</span>
          <span className={`${badge} ${badgeText} text-xs w-5 h-5 rounded-full flex items-center justify-center`}>
            {powerups[type]}
          </span>
        </button>
      ))}
    </div>
  );
}

import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import { POWERUP_CONFIG } from '../lib/constants.js';

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

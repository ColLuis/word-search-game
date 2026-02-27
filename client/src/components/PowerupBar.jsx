import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';

export default function PowerupBar() {
  const { state } = useGame();
  const { powerups } = state;

  const handleUse = (type) => {
    getSocket().emit('powerup:use', { type });
  };

  return (
    <div className="flex gap-2 justify-center mt-2">
      <button
        onClick={() => handleUse('freeze')}
        disabled={powerups.freeze <= 0}
        className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm px-3 py-1.5 rounded-lg transition"
      >
        <span>Freeze</span>
        {powerups.freeze > 0 && (
          <span className="bg-cyan-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {powerups.freeze}
          </span>
        )}
      </button>
      <button
        onClick={() => handleUse('hint')}
        disabled={powerups.hint <= 0}
        className="flex items-center gap-1 bg-yellow-800 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm px-3 py-1.5 rounded-lg transition"
      >
        <span>Hint</span>
        {powerups.hint > 0 && (
          <span className="bg-yellow-500 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {powerups.hint}
          </span>
        )}
      </button>
    </div>
  );
}

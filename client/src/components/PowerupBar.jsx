import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';

export default function PowerupBar() {
  const { state } = useGame();
  const { powerups } = state;

  const handleUse = (type) => {
    getSocket().emit('powerup:use', { type });
  };

  return (
    <div className="flex gap-2 justify-center mt-2 flex-wrap">
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
      <button
        onClick={() => handleUse('fog')}
        disabled={powerups.fog <= 0}
        className="flex items-center gap-1 bg-purple-800 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm px-3 py-1.5 rounded-lg transition"
      >
        <span>Fog</span>
        {powerups.fog > 0 && (
          <span className="bg-purple-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {powerups.fog}
          </span>
        )}
      </button>
      <button
        onClick={() => handleUse('bonus')}
        disabled={powerups.bonus <= 0}
        className="flex items-center gap-1 bg-green-800 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm px-3 py-1.5 rounded-lg transition"
      >
        <span>Bonus</span>
        {powerups.bonus > 0 && (
          <span className="bg-green-500 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {powerups.bonus}
          </span>
        )}
      </button>
      <button
        onClick={() => handleUse('mirror')}
        disabled={powerups.mirror <= 0}
        className="flex items-center gap-1 bg-pink-800 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm px-3 py-1.5 rounded-lg transition"
      >
        <span>Mirror</span>
        {powerups.mirror > 0 && (
          <span className="bg-pink-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {powerups.mirror}
          </span>
        )}
      </button>
    </div>
  );
}

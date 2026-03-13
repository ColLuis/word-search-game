import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import { POWERUP_CONFIG } from '../lib/constants.js';
import { playPowerupUse } from '../../../lib/sounds.js';

const SPIN_DURATION = 1500; // ms to spin before revealing choices
const AUTO_PICK_DELAY = 5000; // auto-pick after 5s of showing choices

export default function PowerupRoulette() {
  const { state, dispatch } = useGame();
  const { powerupChoices } = state;
  const [phase, setPhase] = useState('idle'); // idle | spinning | choosing
  const [spinIndex, setSpinIndex] = useState(0);
  const autoPickRef = useRef(null);
  const spinRef = useRef(null);

  // Start spin when choices arrive
  useEffect(() => {
    if (powerupChoices && powerupChoices.length > 0 && phase === 'idle') {
      setPhase('spinning');
      playPowerupUse();

      // Spin animation — cycle through all powerup emojis quickly
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setSpinIndex(i);
      }, 60);
      spinRef.current = interval;

      // After spin duration, reveal choices
      setTimeout(() => {
        clearInterval(interval);
        spinRef.current = null;
        setPhase('choosing');
      }, SPIN_DURATION);
    }
  }, [powerupChoices, phase]);

  // Auto-pick timeout when choosing
  useEffect(() => {
    if (phase === 'choosing' && powerupChoices) {
      autoPickRef.current = setTimeout(() => {
        handlePick(powerupChoices[0]);
      }, AUTO_PICK_DELAY);

      return () => {
        if (autoPickRef.current) clearTimeout(autoPickRef.current);
      };
    }
  }, [phase, powerupChoices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinRef.current) clearInterval(spinRef.current);
      if (autoPickRef.current) clearTimeout(autoPickRef.current);
    };
  }, []);

  const handlePick = (type) => {
    if (autoPickRef.current) clearTimeout(autoPickRef.current);
    getSocket().emit('powerup:choose', { type });
    dispatch({ type: 'POWERUP_CHOICE_MADE' });
    setPhase('idle');
  };

  if (!powerupChoices || phase === 'idle') return null;

  const choiceConfigs = powerupChoices.map(
    (type) => POWERUP_CONFIG.find((p) => p.type === type) || { type, label: type, emoji: '?', bg: 'bg-gray-700', hover: 'hover:bg-gray-600' }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
        {phase === 'spinning' && (
          <>
            <p className="text-gray-400 text-sm mb-3">Powerup incoming...</p>
            <div className="text-6xl mb-2 transition-all">
              {POWERUP_CONFIG[spinIndex % POWERUP_CONFIG.length].emoji}
            </div>
            <div className="text-lg font-bold text-white">
              {POWERUP_CONFIG[spinIndex % POWERUP_CONFIG.length].label}
            </div>
          </>
        )}

        {phase === 'choosing' && (
          <>
            <p className="text-gray-400 text-sm mb-4">Pick your powerup!</p>
            <div className="flex gap-3 justify-center">
              {choiceConfigs.map(({ type, label, emoji, bg, hover }) => (
                <button
                  key={type}
                  onClick={() => handlePick(type)}
                  className={`${bg} ${hover} flex flex-col items-center gap-2 px-4 py-4 rounded-xl transition transform hover:scale-105 active:scale-95 min-w-[80px]`}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-white text-sm font-bold">{label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{
                  animation: `timer-shrink ${AUTO_PICK_DELAY}ms linear forwards`,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

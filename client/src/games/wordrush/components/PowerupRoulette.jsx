import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { getSocket } from '../lib/socket.js';
import { POWERUP_CONFIG } from '../lib/constants.js';
import { playPowerupUse } from '../../../lib/sounds.js';

const SPIN_DURATION = 1000;
const AUTO_PICK_DELAY = 5000;

export default function PowerupRoulette() {
  const { state, dispatch } = useGame();
  const { powerupChoices } = state;
  const [phase, setPhase] = useState('idle');
  const [spinIndex, setSpinIndex] = useState(0);
  const autoPickRef = useRef(null);
  const spinRef = useRef(null);

  useEffect(() => {
    if (powerupChoices && powerupChoices.length > 0 && phase === 'idle') {
      setPhase('spinning');
      playPowerupUse();

      let i = 0;
      const interval = setInterval(() => {
        i++;
        setSpinIndex(i);
      }, 60);
      spinRef.current = interval;

      setTimeout(() => {
        clearInterval(interval);
        spinRef.current = null;
        setPhase('choosing');
      }, SPIN_DURATION);
    }
  }, [powerupChoices, phase]);

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
    (type) =>
      POWERUP_CONFIG.find((p) => p.type === type) || {
        type,
        label: type,
        emoji: '?',
        bg: 'bg-gray-700',
        hover: 'hover:bg-gray-600',
      }
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm mx-4 mb-4 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-2xl px-4 py-3 shadow-xl animate-fade-in">
        {phase === 'spinning' && (
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {POWERUP_CONFIG[spinIndex % POWERUP_CONFIG.length].emoji}
            </span>
            <span className="text-gray-400 text-sm font-medium">Powerup incoming…</span>
          </div>
        )}

        {phase === 'choosing' && (
          <>
            <p className="text-gray-400 text-xs font-medium mb-2">Pick your powerup</p>
            <div className="flex gap-2">
              {choiceConfigs.map(({ type, label, emoji, bg, hover }) => (
                <button
                  key={type}
                  onClick={() => handlePick(type)}
                  className={`${bg} ${hover} flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition transform hover:scale-105 active:scale-95`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-white text-xs font-bold leading-tight">{label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 w-full h-0.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ animation: `timer-shrink ${AUTO_PICK_DELAY}ms linear forwards` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useGame } from '../context/GameContext.jsx';

export default function FreezeOverlay() {
  const { state } = useGame();
  if (!state.frozen) return null;

  return (
    <div className="fixed inset-0 bg-accent-teal/90 pointer-events-auto z-40 flex items-center justify-center">
      <div className="text-5xl font-display font-bold uppercase tracking-wider text-white animate-pulse">
        FROZEN!
      </div>
    </div>
  );
}

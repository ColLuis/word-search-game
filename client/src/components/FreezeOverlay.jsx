import { useGame } from '../context/GameContext.jsx';

export default function FreezeOverlay() {
  const { state } = useGame();
  if (!state.frozen) return null;

  return (
    <div className="fixed inset-0 bg-cyan-400/20 pointer-events-auto z-40 flex items-center justify-center animate-freeze-in">
      <div className="text-4xl font-bold text-cyan-300 animate-pulse">FROZEN!</div>
    </div>
  );
}

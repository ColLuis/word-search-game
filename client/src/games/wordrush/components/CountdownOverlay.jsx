import { useGame } from '../context/GameContext.jsx';

export default function CountdownOverlay() {
  const { state } = useGame();
  if (state.phase !== 'countdown') return null;

  return (
    <div className="fixed inset-0 bg-canvas/95 backdrop-blur-sm flex items-center justify-center z-50">
      <span className="text-[12rem] font-display font-bold text-accent-orange animate-ping-once">
        {state.countdown}
      </span>
    </div>
  );
}

import { useGame } from '../context/GameContext.jsx';

export default function CountdownOverlay() {
  const { state } = useGame();
  if (state.phase !== 'countdown') return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <span className="text-8xl font-bold text-white animate-ping-once">
        {state.countdown}
      </span>
    </div>
  );
}

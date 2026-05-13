import { useGame } from '../context/GameContext.jsx';

export default function Toast() {
  const { state } = useGame();
  if (!state.toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-accent-red text-white px-4 py-2 rounded-xl shadow-card font-sans font-bold animate-fade-in-out">
      {state.toast}
    </div>
  );
}

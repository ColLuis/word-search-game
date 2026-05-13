import { useGame } from '../context/GameContext.jsx';

export default function ReconnectBanner() {
  const { state } = useGame();
  if (!state.opponentDisconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-accent-orange text-white text-center py-2 text-sm font-bold font-sans z-50 shadow-card">
      Opponent disconnected. Waiting for reconnection...
    </div>
  );
}

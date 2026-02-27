import { useGame } from '../context/GameContext.jsx';

export default function ReconnectBanner() {
  const { state } = useGame();
  if (!state.opponentDisconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 text-sm z-50">
      Opponent disconnected. Waiting for reconnection...
    </div>
  );
}

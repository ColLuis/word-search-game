import { GameProvider, useGame } from './context/GameContext.jsx';
import useSocket from './hooks/useSocket.js';
import HomeScreen from './screens/HomeScreen.jsx';
import LobbyScreen from './screens/LobbyScreen.jsx';
import GameScreen from './screens/GameScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';

function AppContent() {
  const { state } = useGame();
  useSocket();

  switch (state.phase) {
    case 'home':
      return <HomeScreen />;
    case 'lobby':
      return <LobbyScreen />;
    case 'countdown':
    case 'playing':
      return <GameScreen />;
    case 'results':
      return <ResultsScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

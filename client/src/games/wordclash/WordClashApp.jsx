import { GameProvider, useGame } from './context/GameContext.jsx';
import useSocket from './hooks/useSocket.js';
import HomeScreen from './screens/HomeScreen.jsx';
import LobbyScreen from './screens/LobbyScreen.jsx';
import GameScreen from './screens/GameScreen.jsx';
import RoundResultsScreen from './screens/RoundResultsScreen.jsx';
import GameOverScreen from './screens/GameOverScreen.jsx';

function WordClashContent() {
  const { state } = useGame();
  useSocket();

  switch (state.phase) {
    case 'home':
      return <HomeScreen />;
    case 'lobby':
      return <LobbyScreen />;
    case 'playing':
      return <GameScreen />;
    case 'roundResults':
      return <RoundResultsScreen />;
    case 'gameOver':
      return <GameOverScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function WordClashApp() {
  return (
    <GameProvider>
      <WordClashContent />
    </GameProvider>
  );
}

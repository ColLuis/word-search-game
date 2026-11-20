import useLeafline from './hooks/useLeafline.js';
import HomeScreen from './screens/HomeScreen.jsx';
import LobbyScreen from './screens/LobbyScreen.jsx';
import WritingScreen from './screens/WritingScreen.jsx';
import GuessingScreen from './screens/GuessingScreen.jsx';
import RevealScreen from './screens/RevealScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';
import { Toast } from './components/Chrome.jsx';

const SCREENS = {
  lobby: LobbyScreen,
  writing: WritingScreen,
  guessing: GuessingScreen,
  reveal: RevealScreen,
  results: ResultsScreen,
};

export default function LeaflineApp() {
  const game = useLeafline();
  const { room, playerId, toast, restoring } = game;
  const inRoom = room && playerId && room.players.some((p) => p.id === playerId);
  const Screen = inRoom ? SCREENS[room.phase] : null;

  return (
    <>
      <Toast message={toast} />
      {Screen ? (
        <Screen room={room} playerId={playerId} send={game.send} leave={game.leave} />
      ) : restoring ? (
        <div className="flex items-center justify-center min-h-screen text-ink-muted font-sans">
          Rejoining…
        </div>
      ) : (
        <HomeScreen createRoom={game.createRoom} joinRoom={game.joinRoom} />
      )}
    </>
  );
}

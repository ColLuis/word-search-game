import { useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';
import Grid from '../components/Grid.jsx';
import WordList from '../components/WordList.jsx';
import ScoreHeader from '../components/ScoreHeader.jsx';
import PowerupBar from '../components/PowerupBar.jsx';
import CountdownOverlay from '../components/CountdownOverlay.jsx';
import FreezeOverlay from '../components/FreezeOverlay.jsx';
import ReconnectBanner from '../components/ReconnectBanner.jsx';
import Toast from '../components/Toast.jsx';

export default function GameScreen() {
  const { state } = useGame();

  useEffect(() => {
    if (state.phase === 'playing') {
      window.scrollTo(0, 0);
    }
  }, [state.phase]);

  return (
    <div className="flex flex-col items-center min-h-screen px-2 py-2">
      <CountdownOverlay />
      <FreezeOverlay />
      <ReconnectBanner />
      <Toast />

      {state.phase === 'playing' && (
        <>
          <ScoreHeader />
          <Grid />
          <PowerupBar />
          <WordList />
        </>
      )}
    </div>
  );
}

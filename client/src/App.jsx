import { Routes, Route } from 'react-router-dom';
import LandingPage from './screens/LandingPage.jsx';
import WordRushApp from './games/wordrush/WordRushApp.jsx';

// Lazy-load WordClash when it's ready
import { lazy, Suspense } from 'react';
const WordClashApp = lazy(() => import('./games/wordclash/WordClashApp.jsx'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/wordrush/*" element={<WordRushApp />} />
      <Route
        path="/wordclash/*"
        element={
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>}>
            <WordClashApp />
          </Suspense>
        }
      />
    </Routes>
  );
}

import { useEffect, useState } from 'react';
import Home from '../screens/Home/Home';
import LetterGarden from '../screens/LetterGarden/LetterGarden';
import FamilyBook from '../screens/FamilyBook/FamilyBook';
import { SettingsProvider } from './settings';
import { warmUpSpeech } from '../audio/speech';
import type { Route } from './routes';

/**
 * App shell. Routing is in-app state: one screen at a time, always one way
 * home. The session timer and the Goodnight lock arrive in phase 3.
 */
function Screens() {
  const [route, setRoute] = useState<Route>('home');

  // iOS needs the first utterance inside a user gesture, and voices load
  // lazily, so the very first touch anywhere primes speech (SPEC 7).
  useEffect(() => {
    const prime = () => warmUpSpeech();
    window.addEventListener('pointerdown', prime, { once: true });
    return () => window.removeEventListener('pointerdown', prime);
  }, []);

  const goHome = () => setRoute('home');

  switch (route) {
    case 'letters':
      return <LetterGarden onHome={goHome} />;
    case 'book':
      return <FamilyBook onHome={goHome} />;
    case 'home':
    case 'numbers':
    case 'song':
    default:
      return <Home onGo={setRoute} />;
  }
}

export default function App() {
  return (
    <SettingsProvider>
      <Screens />
    </SettingsProvider>
  );
}

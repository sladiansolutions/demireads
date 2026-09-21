import { useEffect, useState } from 'react';
import Home from '../screens/Home/Home';
import LetterGarden from '../screens/LetterGarden/LetterGarden';
import FamilyBook from '../screens/FamilyBook/FamilyBook';
import ParentArea from '../screens/parent/ParentArea';
import { SettingsProvider, useSettingsLoaded } from './settings';
import { MediaProvider } from './media';
import { warmUpSpeech } from '../audio/speech';
import { requestPersistentStorage } from '../storage/persist';
import type { Route } from './routes';

/**
 * App shell. Routing is in-app state: one screen at a time, always one way
 * home. The session timer and the Goodnight lock arrive in phase 3.
 */
function Screens() {
  const [route, setRoute] = useState<Route>('home');
  const loaded = useSettingsLoaded();

  // SPEC 8: ask the browser to keep our data before there is any to lose.
  // Photos and clips are the family's only copy until export lands.
  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  // iOS needs the first utterance inside a user gesture, and voices load
  // lazily, so the very first touch anywhere primes speech (SPEC 7).
  useEffect(() => {
    const prime = () => warmUpSpeech();
    window.addEventListener('pointerdown', prime, { once: true });
    return () => window.removeEventListener('pointerdown', prime);
  }, []);

  // A blank ground rather than a flash of the default name.
  if (!loaded) return <div className="app-loading" />;

  const goHome = () => setRoute('home');

  switch (route) {
    case 'letters':
      return <LetterGarden onHome={goHome} />;
    case 'book':
      return <FamilyBook onHome={goHome} />;
    case 'parent':
      return <ParentArea onBack={goHome} />;
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
      <MediaProvider>
        <Screens />
      </MediaProvider>
    </SettingsProvider>
  );
}

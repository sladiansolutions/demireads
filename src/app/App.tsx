import { useEffect, useState } from 'react';
import Home from '../screens/Home/Home';
import LetterGarden from '../screens/LetterGarden/LetterGarden';
import FamilyBook from '../screens/FamilyBook/FamilyBook';
import CountDucks from '../screens/CountDucks/CountDucks';
import AlphabetSong from '../screens/AlphabetSong/AlphabetSong';
import Goodnight from '../screens/Goodnight/Goodnight';
import ParentArea from '../screens/parent/ParentArea';
import { SettingsProvider, useSettingsLoaded } from './settings';
import { MediaProvider } from './media';
import { SessionProvider, useSession } from './session';
import { warmUpSpeech } from '../audio/speech';
import { requestPersistentStorage } from '../storage/persist';
import type { Route } from './routes';

/**
 * App shell. Routing is in-app state: one screen at a time, always one way
 * home. The session timer always wins, so Goodnight can replace any child
 * screen at any moment (SPEC 5.6, 3.7).
 */
function Screens() {
  const [route, setRoute] = useState<Route>('home');
  const loaded = useSettingsLoaded();
  const { locked, noteInteraction, unlock } = useSession();

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

  // Passing the gate from Goodnight both ends the lock and lands the parent
  // somewhere useful (SPEC 3.7, 3.8).
  if (locked && route !== 'parent') {
    return (
      <Goodnight
        onParent={() => {
          void unlock();
          setRoute('parent');
        }}
      />
    );
  }

  if (route === 'parent') return <ParentArea onBack={goHome} />;

  // Any touch on the child side starts the session clock; begin() is
  // idempotent, so repeating it costs nothing.
  return (
    <div className="child" onPointerDown={noteInteraction}>
      {route === 'letters' && <LetterGarden onHome={goHome} />}
      {route === 'book' && <FamilyBook onHome={goHome} />}
      {route === 'numbers' && <CountDucks onHome={goHome} />}
      {route === 'song' && <AlphabetSong onHome={goHome} />}
      {route === 'home' && <Home onGo={setRoute} />}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <SessionProvider>
        <MediaProvider>
          <Screens />
        </MediaProvider>
      </SessionProvider>
    </SettingsProvider>
  );
}

import { useState, useEffect, useCallback } from 'react';
import FlipCard from './FlipCard';

// Slot Data - CVC (Default)
const SLOT_1_CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'y', 'z'];
const SLOT_2_VOWELS = ['a', 'e', 'i', 'o', 'u'];
const SLOT_3_CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];

// Slot Data - Double Vowels
const DOUBLE_VOWELS_LIST = ['ai', 'ay', 'ee', 'ea', 'ie', 'oa', 'oe', 'ue', 'oo', 'ou', 'ow', 'oi', 'oy', 'au', 'aw', 'ew'];

// Slot Data - Double Consonants (Blends & Digraphs)
const DOUBLE_CONSONANTS_START = ['bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'st', 'sp', 'sm', 'sn', 'sc', 'sk', 'sw', 'ch', 'sh', 'th', 'wh', 'ph'];
const DOUBLE_CONSONANTS_END = ['ch', 'sh', 'th', 'ng', 'nk', 'ck', 'mb', 'ss', 'll', 'ff', 'zz', 'st', 'nd', 'nt', 'mp'];

type Mode = 'CVC' | 'DOUBLE_VOWELS' | 'DOUBLE_CONSONANTS';

function getRandomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Phonics Dictionary to trick Web Speech API into saying the letter sounds instead of letter names/abbreviations.
const PHONICS_MAP: Record<string, string> = {
  // Short Vowels
  'a': 'æ', 'e': 'eh', 'i': 'ih', 'o': 'ah', 'u': 'uh',
  // Consonants (approximate sounds)
  'b': 'buh', 'c': 'kuh', 'd': 'duh', 'f': 'fff', 'g': 'guh', 'h': 'huh',
  'j': 'juh', 'k': 'kuh', 'l': 'lll', 'm': 'mmm', 'n': 'nnn', 'p': 'puh',
  'q': 'kwuh', 'r': 'rrr', 's': 'sss', 't': 'tuh', 'v': 'vvv', 'w': 'wuh',
  'x': 'ks', 'y': 'yuh', 'z': 'zzz',
  // Double Vowels
  'ai': 'ay', 'ay': 'ay', 'ee': 'ee', 'ea': 'ee', 'ie': 'eye', 'oa': 'oh',
  'oe': 'oh', 'ue': 'oo', 'oo': 'oo', 'ou': 'ow', 'ow': 'ow', 'oi': 'oy',
  'oy': 'oy', 'au': 'aw', 'aw': 'aw', 'ew': 'oo',
  // Consonant Blends/Digraphs
  'bl': 'bluh', 'cl': 'kluh', 'fl': 'fluh', 'gl': 'gluh', 'pl': 'pluh', 'sl': 'sluh',
  'br': 'bruh', 'cr': 'kruh', 'dr': 'druh', 'fr': 'fruh', 'gr': 'gruh', 'pr': 'pruh', 'tr': 'truh',
  'st': 'st', 'sp': 'sp', 'sm': 'sm', 'sn': 'sn', 'sc': 'sk', 'sk': 'sk', 'sw': 'sw',
  'ch': 'ch', 'sh': 'sh', 'th': 'th', 'wh': 'wuh', 'ph': 'fff',
  'ng': 'ng', 'nk': 'ngk', 'ck': 'k', 'mb': 'm', 'ss': 'sss', 'll': 'lll', 'ff': 'fff', 'zz': 'zzz',
  'nd': 'nd', 'nt': 'nt', 'mp': 'mp'
};

function App() {
  const [mode, setMode] = useState<Mode>('CVC');
  const [word, setWord] = useState<[string, string, string]>(['', '', '']);

  const getArraysForMode = useCallback((currentMode: Mode) => {
    switch (currentMode) {
      case 'DOUBLE_VOWELS':
        return [SLOT_1_CONSONANTS, DOUBLE_VOWELS_LIST, SLOT_3_CONSONANTS];
      case 'DOUBLE_CONSONANTS':
        return [DOUBLE_CONSONANTS_START, SLOT_2_VOWELS, DOUBLE_CONSONANTS_END];
      case 'CVC':
      default:
        return [SLOT_1_CONSONANTS, SLOT_2_VOWELS, SLOT_3_CONSONANTS];
    }
  }, []);

  const generateWord = useCallback((targetMode?: Mode) => {
    const activeMode = targetMode || mode;
    const arrays = getArraysForMode(activeMode);
    setWord([
      getRandomItem(arrays[0]),
      getRandomItem(arrays[1]),
      getRandomItem(arrays[2])
    ]);
  }, [mode, getArraysForMode]);

  const cycleSlot = useCallback((slotIndex: 0 | 1 | 2) => {
    const arrays = getArraysForMode(mode);
    const arr = arrays[slotIndex];
    setWord(prev => {
      const currentLetter = prev[slotIndex];
      const currentIndex = arr.indexOf(currentLetter);
      const nextIndex = (currentIndex + 1) % arr.length;
      const nextWord = [...prev] as [string, string, string];
      nextWord[slotIndex] = arr[nextIndex];
      return nextWord;
    });
  }, [mode, getArraysForMode]);

  // Keyboard integration (Spacebar to spin, ArrowDown to read)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // prevent page scroll
        generateWord();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        readWord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateWord, word]);

  const readWord = () => {
    const fullWord = word.join('');
    if (!fullWord) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Instead of sending "feb", which TTS engines eagerly expand to "February",
    // or sending "cat", we map each slot to its pure phonetic spelling and join them.
    // This forces the TTS engine to read the literal sounds instead of recognizing dictionary words/abbreviations.
    const phoneticWord = `${PHONICS_MAP[word[0]] || word[0]} ${PHONICS_MAP[word[1]] || word[1]} ${PHONICS_MAP[word[2]] || word[2]}`.replace(/\s+/g, '');
    
    const utterance = new SpeechSynthesisUtterance(phoneticWord);
    utterance.lang = 'en-US';
    
    const voices = window.speechSynthesis.getVoices();
    // Prefer local system voices (they usually try to pronounce nonsense words phonetically)
    // Avoid cloud voices like Google's which often spell out unknown short words
    const usVoice = voices.find(v => v.lang === 'en-US' && v.localService === true) 
                 || voices.find(v => v.lang === 'en-US');
    if (usVoice) {
      utterance.voice = usVoice;
    }
    
    // Slightly slower for kids
    utterance.rate = 0.8; 
    
    window.speechSynthesis.speak(utterance);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    generateWord(newMode);
  };

  return (
    <div className="app-container">
      <img src="/logo.png" alt="Logo" className="logo" />
      <h1 className="title">Flip & Read</h1>
      
      <div className="segmented-control">
        <button className={mode === 'CVC' ? 'active' : ''} onClick={() => handleModeChange('CVC')}>CVC</button>
        <button className={mode === 'DOUBLE_VOWELS' ? 'active' : ''} onClick={() => handleModeChange('DOUBLE_VOWELS')}>Double Vowels</button>
        <button className={mode === 'DOUBLE_CONSONANTS' ? 'active' : ''} onClick={() => handleModeChange('DOUBLE_CONSONANTS')}>Double Consonants</button>
      </div>

      <div className="slots-container">
        <FlipCard letter={word[0]} onClick={() => cycleSlot(0)} />
        <FlipCard letter={word[1]} onClick={() => cycleSlot(1)} />
        <FlipCard letter={word[2]} onClick={() => cycleSlot(2)} />
      </div>

      <div className="controls">
        <button className="spin-button" onClick={() => generateWord()}>
          Spin
        </button>
        <p className="hint-text">Press Spacebar to Spin all, or Click a card to change it!</p>
      </div>
    </div>
  );
}

export default App;

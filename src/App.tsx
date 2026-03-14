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
    
    // 이전에 재생되던 음성이 있다면 즉시 종료
    window.speechSynthesis.cancel();
    
    // 약어(feb, jan, wed 등)가 사전에 등록된 단어(February 등)로 자동 변환되는 것을 방지하기 위한 필터링
    let safeWord = fullWord.toLowerCase();
    const overrides: Record<string, string> = {
      'feb': 'febb', 'jan': 'jann', 'mar': 'mahr', 'apr': 'appr',
      'aug': 'awg', 'sep': 'sepp', 'oct': 'ahct', 'nov': 'nahv', 'dec': 'deck',
      'wed': 'wedd', 'sec': 'seck', 'min': 'minn', 'sat': 'satt', 'sun': 'sunn',
      'mon': 'mahn', 'tue': 'tooz', 'thu': 'thuh', 'fri': 'fry'
    };
    
    // 알파벳 하나씩 끊어 읽는 현상 방지를 위해 끝에 마침표를 찍거나 발음을 약간 변형
    const finalUtteranceText = overrides[safeWord] || safeWord + ".";
    
    const utterance = new SpeechSynthesisUtterance(finalUtteranceText);
    utterance.lang = 'en-US';
    
    // Google 클라우드 음성은 의미 없는 단어를 알파벳으로 읽어버리거나 약어로 인식하는 성향이 강함.
    // Mac/iOS 계열의 고품질 로컬 원어민 음성(Samantha, Alex, Siri 등)을 최우선으로 사용하여 파닉스 발음을 강제함.
    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Siri') || v.name.includes('Samantha') || v.name.includes('Alex'))) 
                 || voices.find(v => v.lang === 'en-US' && v.localService)
                 || voices.find(v => v.lang === 'en-US');
                 
    if (usVoice) {
      utterance.voice = usVoice;
    }
    
    // 너무 빠르지 않게 살짝 조절
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

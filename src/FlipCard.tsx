import React, { useEffect, useState, useRef } from 'react';

interface FlipCardProps {
  letter: string;
  onClick?: () => void;
}

const FlipCard: React.FC<FlipCardProps> = ({ letter, onClick }) => {
  const [prevLetter, setPrevLetter] = useState(letter);
  const [isFlipping, setIsFlipping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (letter !== prevLetter) {
      setIsFlipping(true);
      
      // Play a simple clock tick/click sound effect
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio play failed:', e));
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsFlipping(false);
        setPrevLetter(letter);
      }, 400); // matching CSS animation duration
    }
  }, [letter, prevLetter]);

  const textClass = letter.length > 1 ? 'text-content text-long' : 'text-content';

  return (
    <div 
      className={`flip-clock ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className={`flip-card ${isFlipping ? 'flipping' : ''}`}>
        {/* Next letter top half (revealed as flipper drops) */}
        <div className="top"><div className={textClass}>{letter}</div></div>
        {/* Previous letter bottom half (visible until flipper covers it) */}
        <div className="bottom"><div className={textClass}>{prevLetter}</div></div>
        
        {/* The flipper itself */}
        <div className="flipper">
          <div className="flipper-front"><div className={textClass}>{prevLetter}</div></div>
          <div className="flipper-back"><div className={textClass}>{letter}</div></div>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;

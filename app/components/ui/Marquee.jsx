"use client";

import { useEffect, useState } from 'react';

export default function Marquee({ children, speed = 30, direction = 'left' }) {
  const [content, setContent] = useState(children);
  const [isHovered, setIsHovered] = useState(false);

  // Dupliquer le contenu pour une animation fluide
  useEffect(() => {
    setContent(children);
  }, [children]);

  return (
    <div className="relative w-full overflow-hidden h-14 md:h-20 bg-black flex items-center">
      <div 
        className="inline-block whitespace-nowrap will-change-transform text-xl md:text-3xl font-extrabold text-white drop-shadow-lg tracking-wide"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
          animationPlayState: isHovered ? 'paused' : 'running',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="inline-block pr-16">{content}</span>
        <span className="inline-block pr-16">{content}</span>
        <style jsx global>{`
          @keyframes marquee-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

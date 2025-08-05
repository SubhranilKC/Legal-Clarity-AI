import React from 'react';

const letterStyles = (delay: number) => ({
  animation: 'loader-letter-anim 2s infinite',
  animationDelay: `${delay}s`,
});

export default function GeneratingLoader() {
  return (
    <div className="relative flex items-center justify-center w-[180px] h-[180px] font-body text-lg font-light text-white rounded-full bg-transparent select-none">
      <div className="absolute top-0 left-0 w-full aspect-square rounded-full bg-transparent animate-[loader-rotate_2s_linear_infinite] z-0" />
      <span style={letterStyles(0)} className="inline-block opacity-40 z-[1]">G</span>
      <span style={letterStyles(0.1)} className="inline-block opacity-40 z-[1]">e</span>
      <span style={letterStyles(0.2)} className="inline-block opacity-40 z-[1]">n</span>
      <span style={letterStyles(0.3)} className="inline-block opacity-40 z-[1]">e</span>
      <span style={letterStyles(0.4)} className="inline-block opacity-40 z-[1]">r</span>
      <span style={letterStyles(0.5)} className="inline-block opacity-40 z-[1]">a</span>
      <span style={letterStyles(0.6)} className="inline-block opacity-40 z-[1]">t</span>
      <span style={letterStyles(0.7)} className="inline-block opacity-40 z-[1]">i</span>
      <span style={letterStyles(0.8)} className="inline-block opacity-40 z-[1]">n</span>
      <span style={letterStyles(0.9)} className="inline-block opacity-40 z-[1]">g</span>
    </div>
  );
}

import React, { useState } from 'react';

interface ScoringControlsProps {
  onScore: (type: string, runs?: number) => void;
  disabled: boolean;
}

const ScoringControls: React.FC<ScoringControlsProps> = ({ onScore, disabled }) => {
  const [extraMode, setExtraMode] = useState<'wide' | 'noball' | 'bye' | 'legbye' | null>(null);

  const handleRunClick = (runs: number) => {
    if (extraMode) {
      onScore(extraMode, runs);
      setExtraMode(null);
    } else {
      onScore('run', runs);
    }
  };

  const handleExtraClick = (type: 'wide' | 'noball' | 'bye' | 'legbye') => {
    if (extraMode === type) {
      setExtraMode(null); // Toggle off if clicking the same button again
    } else {
      setExtraMode(type);
    }
  };

  const Button: React.FC<{onClick: () => void, children: React.ReactNode, className?: string, customDisabled?: boolean}> = ({ onClick, children, className = '', customDisabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled || customDisabled}
      className={`font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cricket-gray disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      {children}
    </button>
  );
  
  const getExtraButtonClass = (type: 'wide' | 'noball' | 'bye' | 'legbye') => {
    const baseClasses = {
      wide: 'bg-blue-600 hover:bg-blue-500',
      noball: 'bg-yellow-600 hover:bg-yellow-500',
      bye: 'bg-indigo-600 hover:bg-indigo-500',
      legbye: 'bg-purple-600 hover:bg-purple-500',
    };
    if (extraMode === type) {
      return `${baseClasses[type].split(' ')[0]} ring-2 ring-white ring-offset-2 ring-offset-cricket-gray`;
    }
    return baseClasses[type];
  };


  return (
    <div className="bg-cricket-gray p-4 rounded-lg shadow-lg">
       <div className="text-center mb-3 h-6">
        {extraMode && (
            <p 
                key={extraMode} 
                className="text-lg font-semibold capitalize text-gray-300"
                style={{ animation: 'fade-in 0.3s ease-out' }}
            >
                Scoring {extraMode}s...
            </p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {/* Runs */}
        {[0, 1, 2, 3, 4, 6].map(runs => (
          <Button 
            key={runs} 
            onClick={() => handleRunClick(runs)} 
            customDisabled={extraMode && ['bye', 'legbye'].includes(extraMode) && runs === 0}
            className="bg-gray-600 hover:bg-gray-500 text-white text-lg">
            {runs}
          </Button>
        ))}
        <div className="col-span-2"></div>

        {/* Extras */}
        <Button onClick={() => handleExtraClick('wide')} className={`${getExtraButtonClass('wide')} text-white`}>Wide</Button>
        <Button onClick={() => handleExtraClick('noball')} className={`${getExtraButtonClass('noball')} text-white`}>No Ball</Button>
        <Button onClick={() => handleExtraClick('bye')} className={`${getExtraButtonClass('bye')} text-white`}>Bye</Button>
        <Button onClick={() => handleExtraClick('legbye')} className={`${getExtraButtonClass('legbye')} text-white`}>Leg Bye</Button>

        {/* Wicket */}
        <div className="col-span-4 mt-2">
            <Button onClick={() => onScore('wicket')} customDisabled={!!extraMode} className="w-full bg-red-700 hover:bg-red-600 text-white text-xl">
                WICKET
            </Button>
        </div>
      </div>
       <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `}</style>
    </div>
  );
};

export default ScoringControls;
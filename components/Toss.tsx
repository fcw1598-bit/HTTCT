
import React, { useState } from 'react';

interface TossProps {
    teamA: string;
    teamB: string;
    onTossComplete: (wonBy: string, decision: 'bat' | 'bowl') => void;
}

const Toss: React.FC<TossProps> = ({ teamA, teamB, onTossComplete }) => {
    const [isTossing, setIsTossing] = useState(false);
    const [tossWinner, setTossWinner] = useState<string | null>(null);

    const handleToss = () => {
        setIsTossing(true);
        setTimeout(() => {
            const winner = Math.random() < 0.5 ? teamA : teamB;
            setTossWinner(winner);
            setIsTossing(false);
        }, 2000);
    };

    if (tossWinner) {
        return (
            <div className="text-center p-8 bg-cricket-gray rounded-lg shadow-xl animate-fade-in">
                <h2 className="text-2xl font-bold mb-2">Toss Result</h2>
                <p className="text-xl mb-6"><span className="font-bold text-cricket-green">{tossWinner}</span> won the toss!</p>
                <p className="mb-4">What will they do?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => onTossComplete(tossWinner, 'bat')} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition transform hover:scale-105">Elect to Bat</button>
                    <button onClick={() => onTossComplete(tossWinner, 'bowl')} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition transform hover:scale-105">Elect to Bowl</button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center p-8 bg-cricket-gray rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-6">It's Toss Time!</h2>
            <div className="flex justify-center items-center mb-8 h-32">
                {isTossing ? (
                    <div className="w-32 h-32 rounded-full border-4 border-yellow-400 bg-yellow-500 animate-spin-slow flex items-center justify-center shadow-lg">
                        <span className="text-yellow-900 font-bold text-lg">?</span>
                    </div>
                ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-gray-500 bg-gray-700 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">Toss</span>
                    </div>
                )}
            </div>
            <button
                onClick={handleToss}
                disabled={isTossing}
                className="bg-cricket-green text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 disabled:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-green-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out"
            >
                {isTossing ? 'Tossing...' : 'Flip Coin'}
            </button>
            <style>{`
                @keyframes spin-slow { 
                    from { transform: rotateY(0deg); } 
                    to { transform: rotateY(1440deg); } 
                }
                .animate-spin-slow { animation: spin-slow 2s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>
        </div>
    );
};

export default Toss;

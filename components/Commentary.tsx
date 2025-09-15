

import React from 'react';
import type { Commentary } from '../types';
import { BatIcon, BallIcon, ChatBubbleIcon } from './Icons';

interface LiveCommentaryProps {
    commentary: Commentary[];
}

const LiveCommentary: React.FC<LiveCommentaryProps> = ({ commentary }) => {
    return (
        <div className="bg-cricket-gray p-4 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-cricket-green border-b border-cricket-light-gray pb-2 flex items-center gap-2">
                <ChatBubbleIcon className="w-6 h-6" />
                Live Commentary
            </h3>
            <div className="space-y-3 h-64 overflow-y-auto pr-2">
                {commentary.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 animate-fade-in">
                        <div className="flex-shrink-0 mt-1">
                            {c.type === 'gemini' ? (
                                <BallIcon className="w-5 h-5 text-cricket-green" />
                            ) : c.type === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            ) : (
                                <BatIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <p className={`text-sm ${c.type === 'gemini' ? 'text-white' : 'text-gray-400 italic'}`}>
                            {c.text}
                        </p>
                    </div>
                ))}
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default LiveCommentary;
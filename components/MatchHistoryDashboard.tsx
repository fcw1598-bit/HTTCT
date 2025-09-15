import React, { useState, useEffect } from 'react';
import type { Match } from '../types';
import { getMatchHistory, saveMatchHistory } from '../utils/storage';
import MatchDetailModal from './MatchDetailModal';
import { TrashIcon, EyeIcon, TeamIcon, ArchiveIcon } from './Icons';

const MatchHistoryDashboard: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    useEffect(() => {
        const history = getMatchHistory();
        // Sort by date descending
        history.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        setMatches(history);
    }, []);

    const handleDelete = (matchId: string) => {
        if (window.confirm("Are you sure you want to delete this match from history?")) {
            const updatedHistory = matches.filter(m => m.id !== matchId);
            setMatches(updatedHistory);
            saveMatchHistory(updatedHistory);
        }
    };

    if (matches.length === 0) {
        return (
            <div className="text-center p-8 bg-cricket-gray rounded-lg">
                <h2 className="text-2xl font-bold text-white">No Match History Found</h2>
                <p className="text-gray-400 mt-2">Completed matches will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-cricket-gray p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-cricket-green mb-6 flex items-center gap-3">
                <ArchiveIcon className="w-8 h-8" />
                Match History
            </h2>
            <div className="space-y-4">
                {matches.map((match, index) => {
                    const firstInningsBattingTeam = match.teamA.name === match.firstInnings.battingTeam ? match.teamA : match.teamB;
                    const firstInningsBowlingTeam = match.teamA.name === match.firstInnings.bowlingTeam ? match.teamA : match.teamB;

                    return (
                        <div 
                            key={match.id} 
                            className="bg-cricket-light-gray p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in-up" 
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex-grow w-full">
                                <p className="text-sm text-gray-400 mb-2">{new Date(match.id).toLocaleString()}</p>
                                <div className="flex justify-between items-center gap-4">
                                    <TeamDisplay team={firstInningsBattingTeam} score={match.firstInnings.score} wickets={match.firstInnings.wickets} />
                                    <span className="text-gray-400 font-bold">vs</span>
                                    <TeamDisplay team={firstInningsBowlingTeam} score={match.secondInnings?.score} wickets={match.secondInnings?.wickets} />
                                </div>
                                <p className={`mt-3 text-center font-semibold ${match.winner === firstInningsBattingTeam.name || match.winner === firstInningsBowlingTeam.name ? 'text-cricket-green' : 'text-gray-300'}`}>
                                    {match.resultText}
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex sm:flex-col items-center gap-2">
                                <button onClick={() => setSelectedMatch(match)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full transition" aria-label="View Details">
                                    <EyeIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(match.id)} className="p-2 bg-red-600 hover:bg-red-500 rounded-full transition" aria-label="Delete Match">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedMatch && (
                <MatchDetailModal
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
};

const TeamDisplay: React.FC<{ team: any; score?: number; wickets?: number }> = ({ team, score, wickets }) => (
    <div className="flex items-center gap-3 flex-1 justify-center">
        {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-10 h-10 rounded-full object-cover"/>
        ) : (
            <TeamIcon className="w-10 h-10 text-gray-500"/>
        )}
        <div>
            <p className="font-bold">{team.name}</p>
            {score !== undefined && wickets !== undefined && (
                <p className="text-sm text-gray-300">{score}/{wickets}</p>
            )}
        </div>
    </div>
);

export default MatchHistoryDashboard;
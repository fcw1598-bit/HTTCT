import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Tournament, Match, Team, TeamStanding, TournamentFormat } from '../types';
import { getTournaments, saveTournaments, getRegisteredTeams, getMatchHistory } from '../utils/storage';
import { calculateStandings, generateInitialRound, advanceToNextRound } from '../utils/tournament';
import { MatchStatus } from '../types';
import TournamentEditModal from './TournamentEditModal';
import { TeamIcon, TrophyIcon } from './Icons';

interface Matchup {
  teamAId: string;
  teamBId: string;
  overs: number;
  tournamentId: string;
  matchId: string;
}

interface TournamentDashboardProps {
  onStartMatch: (matchup: Matchup) => void;
}

const TournamentDashboard: React.FC<TournamentDashboardProps> = ({ onStartMatch }) => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    const loadData = useCallback(() => {
        setAllTeams(getRegisteredTeams());
        const matchHistory = getMatchHistory();
        setAllMatches(matchHistory);
        const savedTournaments = getTournaments();
        const updatedTournaments = savedTournaments.map(t => 
            t.status !== 'Upcoming' ? calculateStandings(t, matchHistory) : t
        );
        setTournaments(updatedTournaments);

        if (updatedTournaments.length > 0 && !selectedTournamentId) {
            setSelectedTournamentId(updatedTournaments[0].id);
        }
    }, [selectedTournamentId]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const selectedTournament = useMemo(() => {
        return tournaments.find(t => t.id === selectedTournamentId) || null;
    }, [tournaments, selectedTournamentId]);

    const handleSaveTournament = (tournamentData: Omit<Tournament, 'id' | 'status' | 'rounds' | 'currentRound' | 'standings'> & { id?: string }) => {
        let updatedTournaments;
        if (tournamentData.id) { // Editing
             updatedTournaments = tournaments.map(t => 
                t.id === tournamentData.id ? { ...t, ...tournamentData } : t
            );
        } else { // Creating
            const newTournament: Tournament = {
                ...tournamentData,
                id: `tourn_${Date.now()}`,
                status: 'Upcoming',
                rounds: [],
                currentRound: 0,
                standings: tournamentData.teams.map(team => ({
                    teamId: team.id, teamName: team.name, logo: allTeams.find(t => t.id === team.id)?.logo, played: 0, won: 0, lost: 0, tied: 0, points: 0,
                    runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, nrr: 0
                }))
            };
            updatedTournaments = [...tournaments, newTournament];
        }
        saveTournaments(updatedTournaments);
        setTournaments(updatedTournaments);
        setIsModalOpen(false);
        setEditingTournament(null);
    };

    const handleStartTournament = (tournamentId: string) => {
        const tournamentToStart = tournaments.find(t => t.id === tournamentId);
        if (!tournamentToStart) return;
        const tournamentWithFixtures = generateInitialRound(tournamentToStart);
        const updatedTournaments = tournaments.map(t => t.id === tournamentId ? tournamentWithFixtures : t);
        saveTournaments(updatedTournaments);
        setTournaments(updatedTournaments);
    };
    
    const handleDeleteTournament = (tournamentId: string) => {
        if (window.confirm("Are you sure you want to delete this tournament? This will not delete match history, but will remove the tournament structure.")) {
            const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
            saveTournaments(updatedTournaments);
            setTournaments(updatedTournaments);
            if (selectedTournamentId === tournamentId) {
                setSelectedTournamentId(null);
            }
        }
    };

    const handleAdvanceRound = (tournamentId: string) => {
        const tournamentToAdvance = tournaments.find(t => t.id === tournamentId);
        if (!tournamentToAdvance) return;

        const advancedTournament = advanceToNextRound(tournamentToAdvance, allMatches);
        if (advancedTournament.status === 'Finished') {
            alert(`${advancedTournament.standings[0]?.teamName || 'Winner'} has won the tournament!`);
        }
        
        const updatedTournaments = tournaments.map(t => t.id === tournamentId ? advancedTournament : t);
        saveTournaments(updatedTournaments);
        setTournaments(updatedTournaments);
    }
    
    if (tournaments.length === 0 && !isModalOpen) {
        return (
             <div className="text-center p-8 bg-cricket-gray rounded-lg">
                <TrophyIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-white">No Tournaments Found</h2>
                <p className="text-gray-400 mt-2 mb-6">Create a tournament to get started.</p>
                <button onClick={() => { setEditingTournament(null); setIsModalOpen(true); }} className="bg-cricket-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition">
                    Create New Tournament
                </button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-cricket-gray p-4 rounded-lg shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-cricket-green">Tournaments</h3>
                    <button onClick={() => { setEditingTournament(null); setIsModalOpen(true); }} className="bg-green-600/50 text-white font-bold text-lg w-8 h-8 rounded-full hover:bg-green-500 transition">+</button>
                </div>
                <ul className="space-y-2">
                    {tournaments.map(t => (
                        <li key={t.id}>
                            <button
                                onClick={() => setSelectedTournamentId(t.id)}
                                className={`w-full text-left p-3 rounded-md transition-colors ${selectedTournamentId === t.id ? 'bg-cricket-green text-white' : 'bg-cricket-light-gray hover:bg-gray-600'}`}
                            >
                                <p className="font-semibold">{t.name}</p>
                                <p className="text-xs opacity-80">{t.status} - {t.type}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="md:col-span-3 bg-cricket-gray p-6 rounded-lg shadow-lg min-h-[400px]">
                {selectedTournament ? (
                    <TournamentDetails 
                        tournament={selectedTournament} 
                        allTeams={allTeams} 
                        allMatches={allMatches}
                        onStartTournament={handleStartTournament}
                        onDeleteTournament={handleDeleteTournament}
                        onAdvanceRound={handleAdvanceRound}
                        onStartMatch={onStartMatch}
                        onEdit={() => { setEditingTournament(selectedTournament); setIsModalOpen(true); }}
                    />
                ) : (
                     <div className="flex items-center justify-center h-full flex-col">
                        <TrophyIcon className="w-24 h-24 text-gray-600 mb-4" />
                        <p className="text-gray-400 text-lg">Select a tournament to view details.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <TournamentEditModal
                    tournament={editingTournament}
                    onSave={handleSaveTournament}
                    onClose={() => setIsModalOpen(false)}
                    allTeams={allTeams}
                />
            )}
        </div>
    );
};

interface TournamentDetailsProps {
    tournament: Tournament;
    allTeams: Team[];
    allMatches: Match[];
    onStartTournament: (id: string) => void;
    onDeleteTournament: (id: string) => void;
    onAdvanceRound: (id: string) => void;
    onStartMatch: (matchup: Matchup) => void;
    onEdit: () => void;
}

const TournamentDetails: React.FC<TournamentDetailsProps> = ({ tournament, allTeams, allMatches, onStartTournament, onDeleteTournament, onAdvanceRound, onStartMatch, onEdit }) => {
    
    const currentRound = tournament.rounds[tournament.currentRound];
    const isRoundComplete = currentRound?.matchIds.every(id => allMatches.find(m => m.id === id)?.status === MatchStatus.FINISHED);

    const getTeamById = (id: string) => allTeams.find(t => t.id === id);

    const oversForFormat = (format: TournamentFormat) => {
        if (format === 'T10') return 10;
        if (format === 'T20') return 20;
        if (format === 'ODI') return 50;
        return 20; // Default
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-cricket-green">{tournament.name}</h2>
                    <p className="text-gray-400">{tournament.format} | {tournament.type} | {tournament.status}</p>
                </div>
                 <div className="flex gap-2">
                    {tournament.status === 'Upcoming' && <button onClick={onEdit} className="text-sm bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-500 transition">Edit</button>}
                    <button onClick={() => onDeleteTournament(tournament.id)} className="text-sm bg-red-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-red-500 transition">Delete</button>
                </div>
            </div>

            {tournament.status === 'Upcoming' && (
                <div className="text-center bg-cricket-light-gray p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Tournament Has Not Started</h3>
                    <p className="text-gray-300 mb-4">Click below to generate the first round of fixtures and begin the tournament.</p>
                    <button onClick={() => onStartTournament(tournament.id)} className="bg-cricket-green text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition">
                        Start Tournament
                    </button>
                </div>
            )}
            
            {tournament.status !== 'Upcoming' && tournament.type === 'Round Robin' && <StandingsTable standings={tournament.standings} allTeams={allTeams} />}

            {tournament.status === 'In Progress' && currentRound && (
                <div>
                    <h3 className="text-2xl font-bold mb-4 text-center">{currentRound.name}</h3>
                    <div className="space-y-3">
                        {currentRound.matchIds.map(matchId => {
                            const match = allMatches.find(m => m.id === matchId);
                            const [,, teamAId, , teamBId] = matchId.split('_');
                            const teamA = getTeamById(teamAId);
                            const teamB = getTeamById(teamBId);
                            if (!teamA || !teamB) return <div key={matchId} className="bg-cricket-light-gray p-3 rounded-lg text-sm text-red-400">Error: Team data missing for a match.</div>;
                            
                            return (
                                <div key={matchId} className="bg-cricket-light-gray p-4 rounded-lg flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <TeamLogo team={teamA} />
                                        <span className="font-bold">{teamA.name}</span>
                                    </div>
                                    <div className="text-center flex-grow">
                                        {match?.status === MatchStatus.FINISHED ? (
                                            <div>
                                                <p className="text-sm font-bold">{match.firstInnings.score}/{match.firstInnings.wickets} vs {match.secondInnings?.score ?? 0}/{match.secondInnings?.wickets ?? 0}</p>
                                                <p className="text-xs text-cricket-green font-semibold">{match.winner === teamA.name ? `${teamA.name} won` : `${teamB.name} won`}</p>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-gray-500">vs</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{teamB.name}</span>
                                        <TeamLogo team={teamB} />
                                    </div>
                                    <div>
                                        {(!match || match.status === MatchStatus.UPCOMING) && (
                                            <button 
                                                onClick={() => onStartMatch({
                                                    teamAId: teamA.id,
                                                    teamBId: teamB.id,
                                                    overs: oversForFormat(tournament.format),
                                                    tournamentId: tournament.id,
                                                    matchId: matchId,
                                                })}
                                                className="bg-green-600 text-white font-semibold py-1 px-3 rounded-lg text-sm hover:bg-green-500 transition">
                                                Start
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isRoundComplete && tournament.type === 'Knockout' && tournament.status !== 'Finished' && (
                        <div className="text-center mt-6">
                            <button onClick={() => onAdvanceRound(tournament.id)} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition">
                                Advance to Next Round
                            </button>
                        </div>
                    )}
                </div>
            )}

            {tournament.status === 'Finished' && (
                 <div className="text-center bg-cricket-light-gray p-6 rounded-lg">
                    <TrophyIcon className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">Tournament Finished!</h3>
                    <p className="text-gray-300 text-lg">Winner: <span className="font-bold text-cricket-green">{tournament.standings[0]?.teamName || 'N/A'}</span></p>
                </div>
            )}
        </div>
    );
};

const StandingsTable: React.FC<{ standings: TeamStanding[], allTeams: Team[] }> = ({ standings, allTeams }) => {
    const getTeam = (teamId: string) => allTeams.find(t => t.id === teamId);
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4 text-center">Points Table</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cricket-light-gray">
                    <thead className="bg-cricket-light-gray/50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">P</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">W</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">L</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">T</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">NRR</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cricket-light-gray">
                        {standings.map(s => {
                             const team = getTeam(s.teamId);
                             return (
                                <tr key={s.teamId}>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {team?.logo ? <img src={team.logo} alt={team.name} className="w-6 h-6 rounded-full object-cover" /> : <TeamIcon className="w-6 h-6 text-gray-500"/>}
                                            {s.teamName}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">{s.played}</td>
                                    <td className="px-3 py-2 text-center">{s.won}</td>
                                    <td className="px-3 py-2 text-center">{s.lost}</td>
                                    <td className="px-3 py-2 text-center">{s.tied}</td>
                                    <td className="px-3 py-2 text-center">{s.nrr > 0 ? `+${s.nrr.toFixed(3)}` : s.nrr.toFixed(3)}</td>
                                    <td className="px-3 py-2 text-center font-bold">{s.points}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TeamLogo: React.FC<{ team: Team }> = ({ team }) => (
    team.logo ? <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-full object-cover" /> : <TeamIcon className="w-8 h-8 text-gray-500" />
);

export default TournamentDashboard;

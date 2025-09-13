
import React, { useState, useEffect, useMemo } from 'react';
import type { Match, TeamStats } from '../types';
import { getMatchHistory } from '../utils/storage';
import { calculateTeamStats } from '../utils/stats';

const TeamStatsDashboard: React.FC = () => {
    const [history, setHistory] = useState<Match[]>([]);
    const [teams, setTeams] = useState<string[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

    useEffect(() => {
        const loadedHistory = getMatchHistory();
        // Sort history by date descending to show recent matches first
        loadedHistory.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        setHistory(loadedHistory);
        const teamNames = new Set<string>();
        loadedHistory.forEach(match => {
            teamNames.add(match.teamA.name);
            teamNames.add(match.teamB.name);
        });
        const sortedTeams = Array.from(teamNames).sort();
        setTeams(sortedTeams);
        if (sortedTeams.length > 0) {
            setSelectedTeam(sortedTeams[0]);
        }
    }, []);

    const selectedTeamStats = useMemo<TeamStats | null>(() => {
        if (!selectedTeam) return null;
        return calculateTeamStats(selectedTeam, history);
    }, [selectedTeam, history]);
    
    if (teams.length === 0) {
        return (
            <div className="text-center p-8 bg-cricket-gray rounded-lg">
                <h2 className="text-2xl font-bold text-white">No Match History Found</h2>
                <p className="text-gray-400 mt-2">Complete a match to start tracking team statistics.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-cricket-gray p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-cricket-green">Registered Teams</h3>
                <ul className="space-y-2">
                    {teams.map(team => (
                        <li key={team}>
                            <button
                                onClick={() => setSelectedTeam(team)}
                                className={`w-full text-left p-2 rounded-md font-semibold transition-colors ${selectedTeam === team ? 'bg-cricket-green text-white' : 'bg-cricket-light-gray hover:bg-gray-600'}`}
                            >
                                {team}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="md:col-span-3 bg-cricket-gray p-6 rounded-lg shadow-lg">
                {selectedTeamStats && selectedTeam ? (
                    <TeamStatsDetails 
                        stats={selectedTeamStats} 
                        teamName={selectedTeam} 
                        history={history} 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-lg">Select a team to view their statistics.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface TeamStatsDetailsProps {
    stats: TeamStats;
    teamName: string;
    history: Match[];
}

const TeamStatsDetails: React.FC<TeamStatsDetailsProps> = ({ stats, teamName, history }) => {
    
    const teamMatchHistory = useMemo(() => {
        return history.filter(match => match.teamA.name === teamName || match.teamB.name === teamName);
    }, [teamName, history]);

    const StatCard: React.FC<{ label: string; value: string | number | null; delay?: number }> = ({ label, value, delay = 0 }) => (
        <div className="bg-cricket-light-gray p-4 rounded-lg text-center shadow-md animate-fade-in-up" style={{ animationDelay: `${delay}ms`}}>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value ?? 'N/A'}</p>
        </div>
    );

    const chartData = [
        { label: 'Batsmen', runs: stats.roleStats.batsman.runs },
        { label: 'Bowlers', wickets: stats.roleStats.bowler.wickets },
        { label: 'All-Rounders', runs: stats.roleStats.allRounder.runs, wickets: stats.roleStats.allRounder.wickets },
    ];

    return (
        <div className="space-y-8" key={teamName}>
            <div>
                <h2 className="text-3xl font-bold mb-6 text-center text-cricket-green animate-fade-in-up">{stats.name} - Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Matches" value={stats.matchesPlayed} delay={100} />
                    <StatCard label="Wins" value={stats.wins} delay={200} />
                    <StatCard label="Losses" value={stats.losses} delay={300} />
                    <StatCard label="Win %" value={`${stats.winPercentage}%`} delay={400} />
                    <div className="col-span-2 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                       <StatCard label="Avg. Score" value={stats.averageRunsScored} />
                    </div>
                     <div className="col-span-2 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                       <StatCard label="NEMESIS" value={stats.mostFrequentOpponent} />
                    </div>
                </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                <h3 className="text-2xl font-bold mb-4 text-center text-cricket-green">Role Performance Breakdown</h3>
                <RolePerformanceChart data={chartData} />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                <h3 className="text-2xl font-bold mb-4 text-center text-cricket-green">Recent Matches</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {teamMatchHistory.map((match, index) => {
                        const myTeamObj = match.teamA.name === teamName ? match.teamA : match.teamB;
                        const opponentObj = match.teamA.name === teamName ? match.teamB : match.teamA;

                        const myTeamInnings = match.firstInnings.battingTeam === myTeamObj.name ? match.firstInnings : match.secondInnings;
                        const opponentInnings = match.firstInnings.battingTeam === opponentObj.name ? match.firstInnings : match.secondInnings;

                        const myTeamScoreText = myTeamInnings ? `${myTeamInnings.score}/${myTeamInnings.wickets}` : 'DNB';
                        const opponentScoreText = opponentInnings ? `${opponentInnings.score}/${opponentInnings.wickets}` : 'DNB';

                        const isWin = match.winner === teamName;

                        return (
                            <div key={match.id} className={`bg-cricket-light-gray p-4 rounded-lg border-l-4 ${isWin ? 'border-cricket-green' : 'border-red-500'} animate-fade-in-up`} style={{ animationDelay: `${index * 100}ms`}}>
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                    <div>
                                        <p className="font-bold text-lg">vs {opponentObj.name}</p>
                                        <p className="text-sm text-gray-400">{new Date(match.id).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{myTeamObj.name}: {myTeamScoreText}</p>
                                        <p className="text-sm text-gray-300">{opponentObj.name}: {opponentScoreText}</p>
                                    </div>
                                </div>
                                <p className={`mt-2 text-sm font-semibold ${isWin ? 'text-cricket-green' : 'text-red-400'}`}>{match.resultText}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


interface ChartData {
    label: string;
    runs?: number;
    wickets?: number;
}

const RolePerformanceChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    const maxRuns = Math.max(...data.map(d => d.runs || 0), 1); // Avoid division by zero
    const maxWickets = Math.max(...data.map(d => d.wickets || 0), 1);

    return (
        <div className="bg-cricket-light-gray p-4 rounded-lg space-y-4">
            <div className="flex justify-end gap-4 text-xs">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div>Runs</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500"></div>Wickets</div>
            </div>
            {data.map(item => (
                <div key={item.label}>
                    <h4 className="font-semibold text-sm mb-2">{item.label}</h4>
                    <div className="space-y-2">
                        {item.runs !== undefined && (
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-400 w-12">Runs</p>
                                <div className="w-full bg-gray-700 rounded-full h-4">
                                    <div 
                                        className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2 text-xs font-bold animate-fill-bar" 
                                        style={{ width: `${(item.runs / maxRuns) * 100}%` }}
                                    >
                                        {item.runs}
                                    </div>
                                </div>
                            </div>
                        )}
                        {item.wickets !== undefined && (
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-400 w-12">Wickets</p>
                                <div className="w-full bg-gray-700 rounded-full h-4">
                                    <div 
                                        className="bg-red-500 h-4 rounded-full flex items-center justify-end pr-2 text-xs font-bold animate-fill-bar" 
                                        style={{ width: `${(item.wickets / maxWickets) * 100}%` }}
                                    >
                                        {item.wickets}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TeamStatsDashboard;

import type { Match, TeamStats, Player } from '../types';

/**
 * Calculates aggregated performance statistics for a specific team from match history.
 * @param teamName The name of the team to calculate stats for.
 * @param history An array of all match objects.
 * @returns A TeamStats object with calculated data.
 */
export const calculateTeamStats = (teamName: string, history: Match[]): TeamStats => {
    const teamMatches = history.filter(
        match => match.teamA.name === teamName || match.teamB.name === teamName
    );

    const matchesPlayed = teamMatches.length;

    const roleStats = {
        batsman: { runs: 0 },
        bowler: { wickets: 0 },
        allRounder: { runs: 0, wickets: 0 },
    };

    if (matchesPlayed === 0) {
        return {
            name: teamName,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            winPercentage: '0.00',
            totalRunsScored: 0,
            averageRunsScored: '0.00',
            mostFrequentOpponent: null,
            roleStats,
        };
    }

    const wins = teamMatches.filter(match => match.winner === teamName).length;
    const losses = matchesPlayed - wins;
    const winPercentage = ((wins / matchesPlayed) * 100).toFixed(2);

    let totalRunsScored = 0;
    const opponentCounts: { [key: string]: number } = {};

    teamMatches.forEach(match => {
        const myTeam = match.teamA.name === teamName ? match.teamA : match.teamB;
        const opponent = match.teamA.name === teamName ? match.teamB : match.teamA;

        if (match.firstInnings.battingTeam === myTeam.name) {
            totalRunsScored += match.firstInnings.score;
        }
        if (match.secondInnings?.battingTeam === myTeam.name) {
            totalRunsScored += match.secondInnings.score;
        }

        opponentCounts[opponent.name] = (opponentCounts[opponent.name] || 0) + 1;

        myTeam.players.forEach((player: Player) => {
            const battingStats = myTeam.battingStats[player.id];
            const bowlingStats = myTeam.bowlingStats[player.id];

            switch (player.role) {
                case 'Batsman':
                    if (battingStats) roleStats.batsman.runs += battingStats.runs;
                    break;
                case 'Bowler':
                    if (bowlingStats) roleStats.bowler.wickets += bowlingStats.wickets;
                    break;
                case 'All-Rounder':
                    if (battingStats) roleStats.allRounder.runs += battingStats.runs;
                    if (bowlingStats) roleStats.allRounder.wickets += bowlingStats.wickets;
                    break;
                // Wicket-Keepers contributions are captured if they bat or bowl,
                // but not aggregated into a separate role category as per common stats.
                default:
                    break;
            }
        });
    });

    const averageRunsScored = (totalRunsScored / matchesPlayed).toFixed(2);

    const mostFrequentOpponent = Object.keys(opponentCounts).length > 0
        ? Object.keys(opponentCounts).reduce((a, b) => opponentCounts[a] > opponentCounts[b] ? a : b)
        : null;

    return {
        name: teamName,
        matchesPlayed,
        wins,
        losses,
        winPercentage,
        totalRunsScored,
        averageRunsScored,
        mostFrequentOpponent,
        roleStats,
    };
};
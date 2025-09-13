import type { Tournament, Match, TeamStanding, TournamentFormat, TournamentRound } from '../types';
import { MatchStatus } from '../types';

/**
 * Converts overs and balls into a decimal representation for calculations.
 * e.g., 19.4 overs becomes 19 + 4/6 = 19.667
 */
const oversToDecimal = (overs: number, balls: number): number => {
    return overs + balls / 6;
};

/**
 * Calculates the full overs for an innings based on tournament format.
 */
const getMaxOvers = (format: TournamentFormat): number => {
    switch (format) {
        case 'T10': return 10;
        case 'T20': return 20;
        case 'ODI': return 50;
        case 'Test': return 999; // Represents a very long match for NRR purposes
        default: return 20; // Default for league, can be customized later
    }
};

/**
 * Calculates and updates the standings for a given tournament based on its matches.
 * @param tournament The tournament to calculate standings for.
 * @param allMatches A list of all matches in the application's history.
 * @returns An updated Tournament object with new standings.
 */
export const calculateStandings = (tournament: Tournament, allMatches: Match[]): Tournament => {
    const tournamentMatches = allMatches.filter(m => m.tournamentId === tournament.id && m.status === MatchStatus.FINISHED);

    const initialStandings: { [teamId: string]: TeamStanding } = {};
    tournament.teams.forEach(team => {
        initialStandings[team.id] = {
            teamId: team.id,
            teamName: team.name,
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            points: 0,
            runsScored: 0,
            oversFaced: 0,
            runsConceded: 0,
            oversBowled: 0,
            nrr: 0
        };
    });

    for (const match of tournamentMatches) {
        const teamAId = match.teamA.id;
        const teamBId = match.teamB.id;
        
        const standingA = initialStandings[teamAId];
        const standingB = initialStandings[teamBId];
        
        if (!standingA || !standingB) continue;

        // Update Played, Wins, Losses, Points
        standingA.played++;
        standingB.played++;

        if (!match.winner) { // Tie or No Result
            standingA.tied++;
            standingB.tied++;
            standingA.points += 1;
            standingB.points += 1;
        } else if (match.winner === standingA.teamName) {
            standingA.won++;
            standingB.lost++;
            standingA.points += 2;
        } else {
            standingB.won++;
            standingA.lost++;
            standingB.points += 2;
        }

        // Update NRR stats for Innings 1
        const i1 = match.firstInnings;
        const i1BattingTeamId = match.teamA.name === i1.battingTeam ? teamAId : teamBId;
        const i1BowlingTeamId = match.teamA.name === i1.bowlingTeam ? teamAId : teamBId;
        let i1Overs = (i1.wickets === 10) ? getMaxOvers(tournament.format) : oversToDecimal(i1.overs, i1.balls);
        initialStandings[i1BattingTeamId].runsScored += i1.score;
        initialStandings[i1BattingTeamId].oversFaced += i1Overs;
        initialStandings[i1BowlingTeamId].runsConceded += i1.score;
        initialStandings[i1BowlingTeamId].oversBowled += i1Overs;
        
        // Update NRR stats for Innings 2
        if (match.secondInnings) {
            const i2 = match.secondInnings;
            const i2BattingTeamId = match.teamA.name === i2.battingTeam ? teamAId : teamBId;
            const i2BowlingTeamId = match.teamA.name === i2.bowlingTeam ? teamAId : teamBId;
            let i2Overs = (i2.wickets === 10) ? getMaxOvers(tournament.format) : oversToDecimal(i2.overs, i2.balls);
            initialStandings[i2BattingTeamId].runsScored += i2.score;
            initialStandings[i2BattingTeamId].oversFaced += i2Overs;
            initialStandings[i2BowlingTeamId].runsConceded += i2.score;
            initialStandings[i2BowlingTeamId].oversBowled += i2Overs;
        }
    }

    // Final NRR calculation and sorting
    const finalStandings = Object.values(initialStandings).map(standing => {
        const runsPerOverScored = standing.oversFaced > 0 ? standing.runsScored / standing.oversFaced : 0;
        const runsPerOverConceded = standing.oversBowled > 0 ? standing.runsConceded / standing.oversBowled : 0;
        standing.nrr = parseFloat((runsPerOverScored - runsPerOverConceded).toFixed(3));
        return standing;
    });

    finalStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.nrr !== a.nrr) return b.nrr - a.nrr;
        return a.teamName.localeCompare(b.teamName);
    });

    return { ...tournament, standings: finalStandings };
};


const getRoundName = (numberOfTeams: number): string => {
    if (numberOfTeams <= 2) return "Final";
    if (numberOfTeams <= 4) return "Semi-Finals";
    if (numberOfTeams <= 8) return "Quarter-Finals";
    if (numberOfTeams <= 16) return "Round of 16";
    return `Round of ${numberOfTeams}`;
}


/**
 * Generates the initial round of fixtures for a tournament.
 * @param tournament The tournament for which to generate fixtures.
 * @returns The updated tournament with the first round created.
 */
export const generateInitialRound = (tournament: Tournament): Tournament => {
    const teams = [...tournament.teams];
    if (teams.length < 2) return tournament;

    let matchIds: string[] = [];
    let roundName = "Round 1";

    if (tournament.type === 'Round Robin') {
        roundName = "League Matches";
        const fixtures: { teamAId: string, teamBId: string }[] = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                fixtures.push({ teamAId: teams[i].id, teamBId: teams[j].id });
            }
        }
        matchIds = fixtures.map(fixture => `match_${tournament.id}_${fixture.teamAId}_vs_${fixture.teamBId}`);
    } else { // Knockout
        roundName = getRoundName(teams.length);
        // Shuffle teams for a random draw
        for (let i = teams.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [teams[i], teams[j]] = [teams[j], teams[i]];
        }
        for (let i = 0; i < teams.length; i += 2) {
            if (teams[i+1]) {
                const fixture = { teamAId: teams[i].id, teamBId: teams[i+1].id };
                 matchIds.push(`match_${tournament.id}_${fixture.teamAId}_vs_${fixture.teamBId}`);
            }
            // Note: Does not handle byes for odd numbers yet. Assumes power of 2.
        }
    }
    
    const initialRound: TournamentRound = {
        name: roundName,
        matchIds,
    };

    return { ...tournament, rounds: [initialRound], status: 'In Progress', currentRound: 0 };
};


/**
 * Advances a knockout tournament to the next round.
 * @param tournament The tournament to advance.
 * @param allMatches The list of all matches to find winners from.
 * @returns The updated tournament with the next round generated.
 */
export const advanceToNextRound = (tournament: Tournament, allMatches: Match[]): Tournament => {
    if (tournament.type !== 'Knockout') return tournament;

    const currentRound = tournament.rounds[tournament.currentRound];
    if (!currentRound) return tournament;

    const winners: { id: string, name: string }[] = [];
    for (const matchId of currentRound.matchIds) {
        const match = allMatches.find(m => m.id === matchId);
        if (!match || match.status !== MatchStatus.FINISHED || !match.winner) {
            // Cannot advance, round not complete
            return tournament; 
        }
        const winnerTeam = match.teamA.name === match.winner ? match.teamA : match.teamB;
        winners.push({ id: winnerTeam.id, name: winnerTeam.name });
    }

    if (winners.length < 2) { // Tournament is over
        return { ...tournament, status: 'Finished' };
    }

    const nextRoundName = getRoundName(winners.length);
    const nextRoundMatchIds: string[] = [];
    for (let i = 0; i < winners.length; i += 2) {
        if (winners[i+1]) {
            const fixture = { teamAId: winners[i].id, teamBId: winners[i+1].id };
            nextRoundMatchIds.push(`match_${tournament.id}_${fixture.teamAId}_vs_${fixture.teamBId}`);
        }
    }

    const nextRound: TournamentRound = {
        name: nextRoundName,
        matchIds: nextRoundMatchIds,
    };

    return {
        ...tournament,
        rounds: [...tournament.rounds, nextRound],
        currentRound: tournament.currentRound + 1,
    };
};
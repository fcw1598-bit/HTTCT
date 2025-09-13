import type { Match, Innings, Team, Player } from '../types';
import { formatOvers, calculateStrikeRate, calculateEconomy } from './cricket';

const separator = (char = '-', length = 50) => `${char.repeat(length)}\n`;

const formatPlayerName = (player: Player | undefined, maxLength = 20): string => {
    if (!player) return 'Unknown'.padEnd(maxLength);
    const name = `${player.name} (${player.role.slice(0,3)})`;
    return name.padEnd(maxLength);
}

const formatBattingInnings = (team: Team, innings: Innings): string => {
    let summary = '';
    summary += `Batting: ${team.name}\n`;
    summary += separator();
    summary += `${'Batsman'.padEnd(20)} R   B   4s  6s   SR\n`;
    summary += separator();

    team.players.forEach(player => {
        const stats = team.battingStats[player.id];
        if (stats && (stats.balls > 0 || stats.isOut)) {
            const name = formatPlayerName(player);
            const runs = String(stats.runs).padEnd(4);
            const balls = String(stats.balls).padEnd(4);
            const fours = String(stats.fours).padEnd(4);
            const sixes = String(stats.sixes).padEnd(4);
            const sr = calculateStrikeRate(stats.runs, stats.balls).padEnd(7);
            const outStatus = stats.isOut ? `(out)` : `(not out)`;
            summary += `${name} ${runs}${balls}${fours}${sixes}${sr} ${outStatus}\n`;
        }
    });

    summary += `\nExtras: ${innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}\n`;
    summary += `Total: ${innings.score}/${innings.wickets} (${formatOvers(innings.overs, innings.balls)} Ov)\n\n`;

    if (innings.fallOfWickets.length > 0) {
        summary += `Fall of Wickets:\n`;
        summary += innings.fallOfWickets.map((fow, index) => {
            const player = team.players.find(p => p.id === fow.playerOutId);
            return `${fow.score}-${index + 1} (${player?.name || 'Unknown'}, ${fow.overs} ov)`;
        }).join(', ') + '\n\n';
    }

    return summary;
};

const formatBowlingInnings = (bowlingTeam: Team, battingInnings: Innings): string => {
    let summary = '';
    summary += `Bowling: ${bowlingTeam.name}\n`;
    summary += separator();
    summary += `${'Bowler'.padEnd(20)} O     M   R   W   Econ\n`;
    summary += separator();
    
    const bowlingTeamPlayers = bowlingTeam.players.filter(p => bowlingTeam.bowlingStats[p.id] && (bowlingTeam.bowlingStats[p.id].overs > 0 || bowlingTeam.bowlingStats[p.id].balls > 0));

    bowlingTeamPlayers.forEach(player => {
        const stats = bowlingTeam.bowlingStats[player.id];
        if (stats) {
            const name = formatPlayerName(player);
            const overs = formatOvers(stats.overs, stats.balls).padEnd(6);
            const maidens = String(stats.maidens).padEnd(4);
            const runs = String(stats.runs).padEnd(4);
            const wickets = String(stats.wickets).padEnd(4);
            const econ = calculateEconomy(stats.runs, stats.overs, stats.balls).padEnd(6);
            summary += `${name} ${overs}${maidens}${runs}${wickets}${econ}\n`;
        }
    });

    return summary + '\n';
};

export const generateMatchSummaryText = (match: Match): string => {
    const { teamA, teamB, firstInnings, secondInnings, resultText } = match;

    if (!firstInnings) return 'Match data is incomplete.';

    const firstInningsBattingTeam = teamA.name === firstInnings.battingTeam ? teamA : teamB;
    const firstInningsBowlingTeam = teamA.name === firstInnings.bowlingTeam ? teamA : teamB;

    let summary = '';
    summary += `MATCH SUMMARY\n`;
    summary += separator('=', 50);
    summary += `${teamA.name} vs ${teamB.name}\n`;
    summary += `Result: ${resultText || 'N/A'}\n`;
    summary += separator('=', 50);
    summary += '\n';

    // First Innings
    summary += `Innings 1: ${firstInningsBattingTeam.name}\n`;
    summary += separator('-', 50);
    summary += formatBattingInnings(firstInningsBattingTeam, firstInnings);
    summary += formatBowlingInnings(firstInningsBowlingTeam, firstInnings);
    summary += '\n';

    // Second Innings
    if (secondInnings) {
        const secondInningsBattingTeam = teamA.name === secondInnings.battingTeam ? teamA : teamB;
        const secondInningsBowlingTeam = teamA.name === secondInnings.bowlingTeam ? teamA : teamB;
        summary += `Innings 2: ${secondInningsBattingTeam.name}\n`;
        summary += separator('-', 50);
        summary += formatBattingInnings(secondInningsBattingTeam, secondInnings);
        summary += formatBowlingInnings(secondInningsBowlingTeam, secondInnings);
    }

    return summary;
};
import type { Match, Player, Team, Innings, BattingStats, BowlingStats, Ball } from '../types';
import { MatchStatus } from '../types';

// Formatting and Calculation Utilities
export const formatOvers = (overs: number, balls: number): string => `${overs}.${balls}`;
export const calculateRunRate = (score: number, overs: number, balls: number): string => {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return '0.00';
  return ((score / totalBalls) * 6).toFixed(2);
};
export const calculateRequiredRunRate = (runsNeeded: number, oversTotal: number, oversBowled: number, ballsBowled: number): string => {
    const ballsRemaining = (oversTotal * 6) - (oversBowled * 6 + ballsBowled);
    if(ballsRemaining <= 0 || runsNeeded <= 0) return '0.00';
    return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
}
export const calculateStrikeRate = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
};
export const calculateEconomy = (runs: number, overs: number, balls: number): string => {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return '0.00';
  return ((runs / totalBalls) * 6).toFixed(2);
};

// State Update Logic
type ScoreInput = {
    type: string;
    runs?: number;
    nextBatsmanId?: string;
    outPlayerId?: string;
    newBowlerId?: string;
};

const getInitialBattingStats = (): BattingStats => ({ runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false });
const getInitialBowlingStats = (): BowlingStats => ({ overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 });

export const updateMatchState = (
  match: Match,
  input: ScoreInput
): { nextState: Match; modal?: { type: string, data?: any } } => {
  // Handle simple cases first
  if (input.type === 'start_second_innings') {
    return {
      nextState: {
        ...match,
        innings: 2,
        status: MatchStatus.IN_PROGRESS,
        striker: null, nonStriker: null, bowler: null,
        secondInnings: {
          battingTeam: match.firstInnings.bowlingTeam,
          bowlingTeam: match.firstInnings.battingTeam,
          score: 0, wickets: 0, overs: 0, balls: 0,
          timeline: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
          fallOfWickets: [],
        },
      },
      modal: { type: 'select_openers' }
    };
  }

  if (input.type === 'new_over') {
    return { nextState: { ...match, bowler: input.newBowlerId! } };
  }

  const originalInnings = match.innings === 1 ? match.firstInnings : match.secondInnings;
  if (!originalInnings) return { nextState: match };

  const originalBattingTeam = match.teamA.name === originalInnings.battingTeam ? match.teamA : match.teamB;
  const originalBowlingTeam = match.teamA.name === originalInnings.bowlingTeam ? match.teamA : match.teamB;
  
  const numberOfPlayers = originalBattingTeam.players.length;
  const maxWickets = numberOfPlayers > 0 ? numberOfPlayers - 1 : 10; // Fallback to 10 for safety

  if (input.type === 'wicket_confirm') {
    const outPlayerId = input.outPlayerId!;
    const newBattingStats = {
      ...originalBattingTeam.battingStats,
      [outPlayerId]: { ...originalBattingTeam.battingStats[outPlayerId], isOut: true, outBy: match.bowler }
    };
    const newBattingTeam = { ...originalBattingTeam, battingStats: newBattingStats };
    const isTeamA = match.teamA.name === newBattingTeam.name;

    return {
      nextState: {
        ...match,
        striker: match.striker === outPlayerId ? input.nextBatsmanId! : match.striker,
        nonStriker: match.nonStriker === outPlayerId ? input.nextBatsmanId! : match.nonStriker,
        teamA: isTeamA ? newBattingTeam : match.teamA,
        teamB: !isTeamA ? newBattingTeam : match.teamB,
      }
    };
  }
  
  const strikerId = match.striker!;
  const nonStrikerId = match.nonStriker!;
  const bowlerId = match.bowler!;

  const runs = input.runs || 0;
  const isLegalDelivery = !['wide', 'noball'].includes(input.type);
  const runsOffBat = ['run', 'noball'].includes(input.type);
  const totalRuns = runs + (['wide', 'noball'].includes(input.type) ? 1 : 0);
  
  const strikerStats = originalBattingTeam.battingStats[strikerId] || getInitialBattingStats();
  const bowlerStats = originalBowlingTeam.bowlingStats[bowlerId] || getInitialBowlingStats();
  
  let newStrikerStats = { ...strikerStats };
  if (runsOffBat) {
    newStrikerStats.runs += runs;
    if (runs === 4) newStrikerStats.fours++;
    if (runs === 6) newStrikerStats.sixes++;
  }
  if (isLegalDelivery) newStrikerStats.balls++;

  let newBowlerStats = { ...bowlerStats, runs: bowlerStats.runs + totalRuns };
  if (isLegalDelivery) newBowlerStats.balls++;
  
  let isWicket = input.type === 'wicket';
  if (isWicket) {
    newBowlerStats.wickets++;
    newStrikerStats.isOut = true;
    newStrikerStats.outBy = bowlerId;
  }
  
  const newBalls = isLegalDelivery ? originalInnings.balls + 1 : originalInnings.balls;
  const endOfOver = isLegalDelivery && newBalls === 6;

  if (endOfOver) {
    newBowlerStats.overs++;
    newBowlerStats.balls = 0;
  }
  
  let newStrikerId = strikerId;
  let newNonStrikerId = nonStrikerId;
  if ((runs % 2 !== 0 && ['run', 'bye', 'legbye'].includes(input.type)) || (runs % 2 === 0 && endOfOver)) {
      [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
  } else if (runs % 2 !== 0 && endOfOver) {
      // Stays at the same end
  } else if (runs % 2 === 0 && !endOfOver) {
      // Stays at the same end
  }


  const newBattingTeam = {
    ...originalBattingTeam,
    battingStats: {
      ...originalBattingTeam.battingStats,
      [strikerId]: newStrikerStats,
      [nonStrikerId]: originalBattingTeam.battingStats[nonStrikerId] || getInitialBattingStats(),
    },
  };
  const newBowlingTeam = { ...originalBowlingTeam, bowlingStats: { ...originalBowlingTeam.bowlingStats, [bowlerId]: newBowlerStats } };
  
  const newInnings = {
    ...originalInnings,
    score: originalInnings.score + totalRuns,
    wickets: originalInnings.wickets + (isWicket ? 1 : 0),
    overs: endOfOver ? originalInnings.overs + 1 : originalInnings.overs,
    balls: endOfOver ? 0 : newBalls,
    timeline: [...originalInnings.timeline, { type: input.type as any, runs: totalRuns, isExtra: !isLegalDelivery || ['bye', 'legbye'].includes(input.type), ballNumber: newBalls, overNumber: originalInnings.overs, bowlerId, batsmanId: strikerId }],
    extras: {
        wides: originalInnings.extras.wides + (input.type === 'wide' ? totalRuns : 0),
        noBalls: originalInnings.extras.noBalls + (input.type === 'noball' ? totalRuns : 0),
        byes: originalInnings.extras.byes + (input.type === 'bye' ? runs : 0),
        legByes: originalInnings.extras.legByes + (input.type === 'legbye' ? runs : 0),
    },
    fallOfWickets: isWicket ? [...originalInnings.fallOfWickets, { score: originalInnings.score + totalRuns, overs: parseFloat(formatOvers(originalInnings.overs, newBalls)), playerOutId: strikerId }] : originalInnings.fallOfWickets,
  };
  
  let nextState: Match = {
    ...match,
    striker: newStrikerId,
    nonStriker: newNonStrikerId,
    teamA: match.teamA.name === newBattingTeam.name ? newBattingTeam : newBowlingTeam,
    teamB: match.teamB.name === newBattingTeam.name ? newBattingTeam : newBowlingTeam,
    [match.innings === 1 ? 'firstInnings' : 'secondInnings']: newInnings,
  };

  let modal;

  if (isWicket && newInnings.wickets < maxWickets) {
      const outPlayers = newBattingTeam.players.filter(p => newBattingTeam.battingStats[p.id]?.isOut).map(p => p.id);
      nextState.striker = null;
      return { nextState, modal: { type: 'select_next_batsman', data: { outPlayerId: strikerId, excludeIds: [...outPlayers, newNonStrikerId] } } };
  }
  
  const inningsOver = newInnings.wickets === maxWickets || (newInnings.overs === match.overs);
  
  if (inningsOver) {
    if (match.innings === 1) {
      nextState.status = MatchStatus.INNINGS_BREAK;
      modal = { type: 'innings_break' };
    } else {
      nextState.status = MatchStatus.FINISHED;
      if (newInnings.score > match.firstInnings.score) {
        nextState.winner = newInnings.battingTeam;
        nextState.resultText = `${nextState.winner} won by ${numberOfPlayers - newInnings.wickets} wickets.`;
      } else if (newInnings.score < match.firstInnings.score) {
        nextState.winner = match.firstInnings.battingTeam;
        nextState.resultText = `${nextState.winner} won by ${match.firstInnings.score - newInnings.score} runs.`;
      } else {
        nextState.resultText = 'Match drawn.';
      }
      modal = { type: 'match_finished' };
    }
  } else if (match.innings === 2 && newInnings.score > match.firstInnings.score) {
    nextState.status = MatchStatus.FINISHED;
    nextState.winner = newInnings.battingTeam;
    nextState.resultText = `${nextState.winner} won by ${numberOfPlayers - newInnings.wickets} wickets.`;
    modal = { type: 'match_finished' };
  } else if (endOfOver) {
    modal = { type: 'select_new_bowler' };
  }
  
  return { nextState, modal };
};
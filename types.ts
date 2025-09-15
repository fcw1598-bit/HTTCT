export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
export type CommentaryStyle = 'Enthusiastic' | 'Humorous' | 'Technical' | 'Analytical';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  photo?: string;
}

export interface PlayerProfile {
    id: string;
    name:string;
    role: PlayerRole;
    bio?: string;
    photo?: string;
}

export interface BattingStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  outBy?: string | null; // Bowler's ID
}

export interface BowlingStats {
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  players: Player[];
  battingStats: { [playerId: string]: BattingStats };
  bowlingStats: { [playerId: string]: BowlingStats };
}

export interface FallOfWicket {
    score: number;
    overs: number;
    playerOutId: string;
}

export interface Ball {
    type: 'run' | 'wicket' | 'wide' | 'noball' | 'bye' | 'legbye';
    runs: number;
    isExtra: boolean;
    ballNumber: number;
    overNumber: number;
    bowlerId: string;
    batsmanId: string;
}

export interface Innings {
    battingTeam: string; // Team name
    bowlingTeam: string; // Team name
    score: number;
    wickets: number;
    overs: number;
    balls: number;
    timeline: Ball[];
    extras: {
        wides: number;
        noBalls: number;
        byes: number;
        legByes: number;
    };
    fallOfWickets: FallOfWicket[];
    targetScore?: number;
}

export enum MatchStatus {
    SETUP = 'SETUP',
    TOSS = 'TOSS',
    IN_PROGRESS = 'IN_PROGRESS',
    INNINGS_BREAK = 'INNINGS_BREAK',
    FINISHED = 'FINISHED',
    UPCOMING = 'UPCOMING'
}

export interface Match {
    id: string;
    status: MatchStatus;
    teamA: Team;
    teamB: Team;
    overs: number;
    innings: 1 | 2;
    toss: {
        wonBy: string; // Team name
        decision: 'bat' | 'bowl';
    };
    firstInnings: Innings;
    secondInnings?: Innings;
    striker: string | null; // Player ID
    nonStriker: string | null; // Player ID
    bowler: string | null; // Player ID
    winner: string | null; // Team name
    resultText: string | null;
    tournamentId?: string;
}

export interface Commentary {
    id: number;
    text: string;
    type: 'system' | 'gemini' | 'loading';
}

export interface TeamStats {
    name: string;
    matchesPlayed: number;
    wins: number;
    losses: number;
    winPercentage: string;
    totalRunsScored: number;
    averageRunsScored: string;
    mostFrequentOpponent: string | null;
    roleStats: {
        batsman: { runs: number };
        bowler: { wickets: number };
        allRounder: { runs: number; wickets: number };
    };
}

// --- Tournament Types ---

export type TournamentFormat = 'T10' | 'T20' | 'ODI' | 'League' | 'Test';
export type TournamentStatus = 'Upcoming' | 'In Progress' | 'Finished';
export type TournamentType = 'Round Robin' | 'Knockout';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  logo?: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  // For NRR calculation
  runsScored: number;
  oversFaced: number; // Stored as a decimal, e.g., 19.4 overs is 19.666
  runsConceded: number;
  oversBowled: number; // Stored as a decimal
  nrr: number;
}

export interface TournamentRound {
  name: string;
  matchIds: string[];
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  type: TournamentType;
  status: TournamentStatus;
  teams: { id: string; name: string }[];
  rounds: TournamentRound[];
  currentRound: number;
  standings: TeamStanding[];
}